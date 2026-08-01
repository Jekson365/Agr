using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestTreesController(IHarvestTreeRepository harvestTreeRepository) : ControllerBase
{
    /// <summary>
    /// An orchard is picked once per harvest: how many of its trees were picked is one number, so
    /// a second row for the same orchard would be a second answer. Change the first row instead.
    /// </summary>
    private const string AlreadyPickedMessage = "This harvest already records those trees as picked.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestTree>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestTreeRepository.GetByHarvestAsync(harvestId));
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

        if (await harvestTreeRepository.ExistsForHarvestAsync(harvestTree.HarvestId, harvestTree.TreeStockId))
        {
            return Conflict(AlreadyPickedMessage);
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
        var deleted = await harvestTreeRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
