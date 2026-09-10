using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestTreesController(
    IHarvestTreeRepository harvestTreeRepository,
    IHarvestRepository harvestRepository) : ControllerBase
{
    private const string BalancedMessage =
        "This harvest's produce is already on the balances, so what it picked is settled.";

    /// <summary>
    /// An orchard is picked once per harvest: how many of its trees were picked is one number, so
    /// a second row for the same orchard would be a second answer. Change the first row instead.
    /// </summary>
    private const string AlreadyPickedMessage = "This harvest already records those trees as picked.";

    /// <summary>
    /// A fruit harvest covers one orchard. Its costs, its revenue and its grading all answer for
    /// that one, so picking a second orchard is a second harvest rather than a second row.
    /// </summary>
    private const string OneOrchardMessage = "A fruit harvest picks one orchard. Record the other on its own harvest.";

    /// <summary>
    /// What came off the trees is weighed at picking time, so it is recorded once the harvest is
    /// marked harvested. Before that a row records which orchard was picked and how many trees.
    /// </summary>
    private const string NotHarvestedMessage =
        "The harvested amount is recorded once the harvest is marked harvested.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestTree>>> GetByHarvest([FromQuery] int? harvestId)
    {
        return Ok(await harvestTreeRepository.GetAsync(harvestId));
    }

    /// <summary>
    /// The orchards some harvest records as picked, across every harvest. What those pickings
    /// yielded is booked against the orchard's product, so this is what tells the fruit form which
    /// rows may no longer change what they produce.
    /// </summary>
    [HttpGet("picked-tree-stocks")]
    public async Task<ActionResult<IEnumerable<int>>> GetPickedTreeStocks()
    {
        return Ok(await harvestTreeRepository.GetPickedTreeStockIdsAsync());
    }

    [HttpPost]
    public async Task<ActionResult<HarvestTree>> Create(HarvestTree harvestTree)
    {
        if (harvestTree.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        if (await SettledAsync(harvestTree.HarvestId))
        {
            return Conflict(BalancedMessage);
        }

        if (harvestTree.HarvestedAmount > 0 && !await PickedAsync(harvestTree.HarvestId))
        {
            return Conflict(NotHarvestedMessage);
        }

        if (await harvestTreeRepository.HasAnyForHarvestAsync(harvestTree.HarvestId))
        {
            return Conflict(
                await harvestTreeRepository.ExistsForHarvestAsync(harvestTree.HarvestId, harvestTree.TreeStockId)
                    ? AlreadyPickedMessage
                    : OneOrchardMessage);
        }

        return Ok(await harvestTreeRepository.AddAsync(harvestTree));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestTree harvestTree)
    {
        if (id != harvestTree.Id)
        {
            return BadRequest();
        }
        if (harvestTree.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        var existing = await harvestTreeRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (await SettledAsync(existing.HarvestId))
        {
            return Conflict(BalancedMessage);
        }

        // A row recorded while the harvest was picked keeps its weight if the status is walked
        // back, so only a change to the figure is refused — not the figure already on the row.
        if (harvestTree.HarvestedAmount != existing.HarvestedAmount && !await PickedAsync(existing.HarvestId))
        {
            return Conflict(NotHarvestedMessage);
        }

        // The harvest a row belongs to is fixed once created, so that's the harvest the orchard
        // has to be unpicked in — not whatever harvest the request happens to name.
        if (await harvestTreeRepository.ExistsForHarvestAsync(existing.HarvestId, harvestTree.TreeStockId, id))
        {
            return Conflict(AlreadyPickedMessage);
        }

        var updated = await harvestTreeRepository.UpdateAsync(harvestTree);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await harvestTreeRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (await SettledAsync(existing.HarvestId))
        {
            return Conflict(BalancedMessage);
        }

        var deleted = await harvestTreeRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Whether the harvest has booked its produce. Editing a picking afterwards would
    /// rewrite the product balance it wrote, the same way a result would.</summary>
    /// <summary>Whether the harvest has reached the point where what came off the trees is known.</summary>
    private async Task<bool> PickedAsync(int harvestId)
    {
        var harvest = await harvestRepository.GetByIdAsync(harvestId);
        return harvest is not null && harvest.Status.IsPicked();
    }

    private async Task<bool> SettledAsync(int harvestId)
    {
        var harvest = await harvestRepository.GetByIdAsync(harvestId);
        return harvest is not null && harvest.Status.CountsInBalance();
    }
}
