using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestItemsController(IHarvestItemRepository harvestItemRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestItem>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestItemRepository.GetByHarvestAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestItem>> Create(HarvestItem item)
    {
        if (item.StockId is null == item.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        var created = await harvestItemRepository.AddAsync(item);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestItem item)
    {
        if (id != item.Id)
        {
            return BadRequest();
        }
        if (item.StockId is null == item.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        var updated = await harvestItemRepository.UpdateAsync(item);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestItemRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
