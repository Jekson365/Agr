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

        var deleted = await treeStockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
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
