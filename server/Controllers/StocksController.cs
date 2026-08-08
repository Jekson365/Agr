using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StocksController(
    IStockRepository stockRepository,
    ISeedRepository seedRepository,
    IHarvestRepository harvestRepository,
    ILandPlotRepository landPlotRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    private const string HarvestRecordedMessage = "A harvest already records this stock, so its type and unit can no longer change.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Stock>>> GetAll()
    {
        return Ok(await stockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Stock>> GetById(int id)
    {
        var stock = await stockRepository.GetByIdAsync(id);
        return stock is null ? NotFound() : Ok(stock);
    }

    [HttpPost]
    public async Task<ActionResult<Stock>> Create(Stock stock)
    {
        var invalid = Validate(stock.Type, stock.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        try
        {
            var currentCount = (await stockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddStockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var created = await stockRepository.AddAsync(stock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Creates a stock and the seed for the same crop in one call. Greenhouse stock is added this
    /// way: the seed isn't optional there, and a client that created the stock and then failed to
    /// send the seed would leave the pair half-made.
    /// </summary>
    [HttpPost("with-seed")]
    public async Task<ActionResult<StockWithSeedResponse>> CreateWithSeed(StockWithSeedRequest request)
    {
        var invalid = Validate(request.Type, request.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }
        if (request.SeedAmount < 0)
        {
            return BadRequest("Seed amount cannot be negative.");
        }
        if (!Enum.IsDefined(request.Unit) || !Enum.IsDefined(request.SeedUnit))
        {
            return BadRequest("Unknown unit.");
        }

        try
        {
            var currentCount = (await stockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddStockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var type = request.Type.Trim();
        var name = request.Name.Trim();

        var stock = await stockRepository.AddAsync(new Stock
        {
            Type = type,
            Name = name,
            Amount = request.Amount,
            Unit = request.Unit,
        });

        // Same crop and same label, so the seed and the produce it grows into read identically.
        var seed = await seedRepository.AddAsync(new Seed
        {
            Type = type,
            Name = name,
            Amount = request.SeedAmount,
            Unit = request.SeedUnit,
        });

        return Ok(new StockWithSeedResponse { Stock = stock, Seed = seed });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Stock stock)
    {
        if (id != stock.Id)
        {
            return BadRequest();
        }

        var invalid = Validate(stock.Type, stock.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var existing = await stockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // A harvest records this good by kind and counts its yield in this unit — its plan rows fall
        // back to it, and its results are what moved the balance. Renaming the kind would rewrite
        // what those harvests say was collected, and reading their amounts in another unit would
        // change how much. Once recorded, both are settled; the amount and label stay editable.
        var kindOrUnitChanged = existing.Unit != stock.Unit
            || !string.Equals(existing.Type.Trim(), stock.Type.Trim(), StringComparison.Ordinal);
        if (kindOrUnitChanged && await harvestRepository.RecordsStockAsync(id))
        {
            return Conflict(HarvestRecordedMessage);
        }

        try
        {
            var currentCount = (await stockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureStockWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var updated = await stockRepository.UpdateAsync(stock);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);

    /// <summary>Shared checks for creating or editing a stock. Returns the problem, or null.</summary>
    private static string? Validate(string type, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return "A stock needs a type.";
        }
        if (amount < 0)
        {
            return "Amount cannot be negative.";
        }
        return null;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // A plot is a plot *of* this stock — with it gone there is nothing growing there, so the
        // plot goes too rather than staying behind as an empty patch of land. Matches how
        // deleting a tree stock takes its plots with it. Before the stock itself, since removing
        // that first would clear the reference the plot is found by.
        await landPlotRepository.DeleteByStockAsync(id);

        var deleted = await stockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Records a marketplace sale: deducts the sold quantity and logs a movement
    /// tagged <see cref="StockMovementSource.Market"/> (instead of a plain manual edit).</summary>
    [HttpPost("{id:int}/sale")]
    public async Task<ActionResult<Stock>> RecordSale(int id, StockSaleRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        var stock = await stockRepository.GetByIdAsync(id);
        if (stock is null)
        {
            return NotFound();
        }

        // The client checks this too, but two sales recorded at once would both pass that check
        // and overdraw the stock; the ledger is only meaningful if it can't go negative. Same
        // guard the production and fruit-produce sale endpoints carry.
        if (request.Quantity > stock.Amount)
        {
            return Conflict($"Only {stock.Amount} of this stock is available.");
        }

        var updated = await stockRepository.AdjustAmountAsync(id, -request.Quantity, StockMovementSource.Market, request.MarketListingId);
        return updated is null ? NotFound() : Ok(updated);
    }
}
