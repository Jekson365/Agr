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
    IPlanLimitService planLimitService) : ControllerBase
{
    private const string HarvestRecordedMessage = "A harvest already records this stock, so its type and unit can no longer change.";
    private const string DeletedMessage = "This stock was removed.";

    /// <summary>
    /// The stocks on hand. Removed ones are left out, which is what hides them from the stock page
    /// and keeps them off every picker; <paramref name="includeDeleted"/> brings them back for the
    /// pages that have to put a name to a harvest or plot recorded against one.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Stock>>> GetAll([FromQuery] bool includeDeleted = false)
    {
        return Ok(await stockRepository.GetAllAsync(includeDeleted));
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

        // Removed stock is kept only so the history recorded against it still reads back; it is
        // out of use, so it takes no more edits.
        if (existing.IsDeleted)
        {
            return Conflict(DeletedMessage);
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

    /// <summary>
    /// Removes a stock from the stock page. The row is marked deleted rather than dropped: harvest
    /// plans and results, the movement log, photos and feed rows all cascade off it, so deleting
    /// it for real would rewrite what past harvests say they produced. Hidden and out of use is
    /// all "removed" has to mean.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await stockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        await stockRepository.SoftDeleteAsync(id);

        // The seed of this crop was created with the stock (see CreateWithSeed) and grows into it,
        // so it goes out of use at the same time. Matched on type and name, which is all the two
        // share — there is no key between them, which is also why another stock still holding that
        // same crop and label keeps the seed: it reads as that stock's seed just as much.
        var stillHeld = (await stockRepository.GetAllAsync())
            .Any(s => s.Id != id
                && string.Equals(s.Type.Trim(), existing.Type.Trim(), StringComparison.OrdinalIgnoreCase)
                && string.Equals(s.Name.Trim(), existing.Name.Trim(), StringComparison.OrdinalIgnoreCase));
        if (!stillHeld)
        {
            await seedRepository.SoftDeleteByCropAsync(existing.Type, existing.Name);
        }

        // The plots stay: nothing is being removed here, and a plot still records how much land
        // was given over to this crop. They fall back to naming their crop once the stock they
        // point at is out of the list.
        return NoContent();
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

        // Removed stock isn't offered for sale anywhere; a sale against it would move an amount
        // nothing shows any more.
        if (stock.IsDeleted)
        {
            return Conflict(DeletedMessage);
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
