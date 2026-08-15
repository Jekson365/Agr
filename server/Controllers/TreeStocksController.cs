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
    private const string ProduceHarvestedMessage = "A harvest already records this fruit as picked, so what it produces can no longer change.";
    private const string ProduceRequiredMessage = "A fruit has to name the product it produces.";
    private const string DeletedMessage = "This fruit was removed.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeStock>>> GetAll([FromQuery] bool includeDeleted = false)
    {
        return Ok(await treeStockRepository.GetAllAsync(includeDeleted));
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

        // An orchard is a count of trees, so it can't start below zero — and a negative opening
        // amount would be stored without a movement to explain it, leaving the Fruit page and the
        // Balance page (which sums the ledger) reading the row as two different numbers forever.
        if (stock.Amount < 0)
        {
            return BadRequest("Amount cannot be negative.");
        }

        // An orchard is the trees that yield one product, so which product is part of recording it
        // rather than something to fill in later: until one is named, a harvest that picks these
        // trees has nowhere to book what it took (see HarvestTreeRepository.SyncProduceAsync) and
        // the produce is silently lost.
        if (stock.TreeProductId is null)
        {
            return BadRequest(ProduceRequiredMessage);
        }

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

        if (stock.Amount < 0)
        {
            return BadRequest("Amount cannot be negative.");
        }

        var existing = await treeStockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // Removed fruit is kept only so the history recorded against it still reads back; it is out
        // of use, so it takes no more edits.
        if (existing.IsDeleted)
        {
            return Conflict(DeletedMessage);
        }

        // Naming no product is "leave it as it is", not "produce nothing" — an orchard keeps the one
        // it holds unless another is named. That is what a client editing the other fields sends
        // (an older app carries no such field at all), and it means no edit can leave trees with
        // nothing to yield. Settled before the checks below, so both compare two real products.
        stock.TreeProductId ??= existing.TreeProductId;

        // What a picked harvest yielded is booked against the orchard's product, so pointing the
        // orchard at another one would move produce nobody harvested onto that product's ledger and
        // leave the old one holding an amount nothing yields. Once picked, the product is settled.
        if (existing.TreeProductId != stock.TreeProductId
            && await harvestTreeRepository.ExistsForTreeStockAsync(id))
        {
            return Conflict(ProduceHarvestedMessage);
        }

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

    /// <summary>
    /// Removes a fruit from the Fruit page. The row is marked deleted rather than dropped: its
    /// movement log, the harvest rows recording these trees as picked and its land plot all cascade
    /// off it, so deleting it for real would rewrite what past harvests say was picked. Hidden and
    /// out of use is all "removed" has to mean — which is also why a harvest having picked it no
    /// longer stands in the way.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await treeStockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        await treeStockRepository.SoftDeleteAsync(id);

        // What it produced stays, balance and harvest history intact — that is a record in its own
        // right, and it belongs to this orchard alone, so no other fruit can pick it up. The plot
        // stays too, as it does for stock: nothing is being removed here, and a plot still records
        // how much land was given over to these trees. It falls back to naming its crop.
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

        var stock = await treeStockRepository.GetByIdAsync(id);
        if (stock is null)
        {
            return NotFound();
        }

        // Removed fruit isn't offered for sale anywhere; a sale against it would move an amount
        // nothing shows any more.
        if (stock.IsDeleted)
        {
            return Conflict(DeletedMessage);
        }

        // The client checks this too, but two sales recorded at once would both pass that check
        // and overdraw the orchard; the ledger is only meaningful if it can't go negative. Same
        // guard the production and fruit-produce sale endpoints carry.
        if (request.Quantity > stock.Amount)
        {
            return Conflict($"Only {stock.Amount} of this fruit is available.");
        }

        var updated = await treeStockRepository.AdjustAmountAsync(id, -request.Quantity, StockMovementSource.Market, request.MarketListingId);
        return updated is null ? NotFound() : Ok(updated);
    }
}
