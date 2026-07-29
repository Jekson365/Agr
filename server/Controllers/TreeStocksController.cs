using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeStocksController(
    ITreeStockRepository treeStockRepository,
    IHarvestTreeRepository harvestTreeRepository,
    IHarvestProductRepository harvestProductRepository,
    ITreeProductRepository treeProductRepository,
    ILandPlotRepository landPlotRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeStock>>> GetAll()
    {
        return Ok(await treeStockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TreeStock>> GetById(int id)
    {
        var stock = await treeStockRepository.GetByIdAsync(id);
        return stock is null ? NotFound() : Ok(stock);
    }

    [HttpPost]
    public async Task<ActionResult<TreeStock>> Create(TreeStock stock)
    {
        stock.Name = stock.Name.Trim();

        var invalid = await ValidateAsync(stock);
        if (invalid is not null)
        {
            return Conflict(invalid);
        }

        try
        {
            var currentCount = (await treeStockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddFruitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var created = await treeStockRepository.AddAsync(stock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TreeStock stock)
    {
        if (id != stock.Id)
        {
            return BadRequest();
        }

        stock.Name = stock.Name.Trim();

        var invalid = await ValidateAsync(stock, id);
        if (invalid is not null)
        {
            return Conflict(invalid);
        }

        try
        {
            var currentCount = (await treeStockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureFruitWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var updated = await treeStockRepository.UpdateAsync(stock);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// The two ways a row can clash with the ones already recorded — its label and the produce it
    /// yields. Returns the problem, or null when the row is free to save.
    /// </summary>
    private async Task<string?> ValidateAsync(TreeStock stock, int? excludeId = null)
    {
        // The custom label is what tells apart two stocks of the same fruit, so it can't be shared —
        // two "Gala Apples" rows would be indistinguishable everywhere they're listed. A blank name
        // is not a label at all: those rows fall back to their fruit's own name, so any number of
        // them may coexist.
        if (stock.Name.Length > 0 && await treeStockRepository.ExistsByNameAsync(stock.Name, excludeId))
        {
            return "A tree stock with this name already exists.";
        }

        // A product comes off one orchard: the row that yields it is that orchard, so no second row
        // may claim the same product.
        if (stock.TreeProductId is int productId
            && await treeStockRepository.ExistsByTreeProductAsync(productId, excludeId))
        {
            return "Another fruit already produces that product.";
        }

        return null;
    }

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Its "trees picked" rows cascade with it, which would rewrite what those harvests
        // recorded — refuse, matching how a seed used by a harvest behaves.
        if (await harvestTreeRepository.ExistsForTreeStockAsync(id))
        {
            return Conflict("A harvest still records this orchard as picked.");
        }

        // Read the row before it goes: what it yields is only knowable from the stock itself.
        var stock = await treeStockRepository.GetByIdAsync(id);
        if (stock is null)
        {
            return NotFound();
        }

        // A plot is a plot *of* these trees — with them gone there is nothing growing there, so it
        // goes too rather than staying behind as an empty patch of land. Before the stock itself,
        // since removing that first would clear the reference the plot is found by.
        await landPlotRepository.DeleteByTreeStockAsync(id);

        var deleted = await treeStockRepository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        // What it produced goes with it, ledger and all (the movements cascade): a product comes
        // off one orchard, so with the trees gone nothing can ever yield it again and it would
        // sit on the Products page as an entry nothing fills. Produce a harvest already recorded
        // is the exception — that history outlives the trees, and the Restrict FK refuses anyway
        // — so the product stays behind to keep it readable.
        if (stock.TreeProductId is int productId && !await harvestProductRepository.ExistsForProductAsync(productId))
        {
            await treeProductRepository.DeleteAsync(productId);
        }

        return NoContent();
    }

    /// <summary>Records a marketplace sale: deducts the sold quantity and logs a movement
    /// tagged <see cref="StockMovementSource.Market"/> (instead of a plain manual edit).</summary>
    [HttpPost("{id:int}/sale")]
    public async Task<ActionResult<TreeStock>> RecordSale(int id, StockSaleRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        var updated = await treeStockRepository.AdjustAmountAsync(id, -request.Quantity, StockMovementSource.Market, request.MarketListingId);
        return updated is null ? NotFound() : Ok(updated);
    }
}
