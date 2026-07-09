using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestResultsController(IHarvestResultRepository harvestResultRepository, IHarvestRepository harvestRepository)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestResult>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestResultRepository.GetByHarvestAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestResult>> Create(HarvestResult result)
    {
        if (result.StockId is null == result.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        var harvest = await harvestRepository.GetByIdAsync(result.HarvestId);
        if (harvest is null)
        {
            return NotFound();
        }
        if (harvest.Status != HarvestStatus.Harvested)
        {
            return BadRequest("The harvest must be marked Harvested before recording its result.");
        }

        var created = await harvestResultRepository.AddAsync(result);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestResult result)
    {
        if (id != result.Id)
        {
            return BadRequest();
        }
        if (result.StockId is null == result.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        var harvest = await harvestRepository.GetByIdAsync(result.HarvestId);
        if (harvest is null)
        {
            return NotFound();
        }
        if (harvest.Status != HarvestStatus.Harvested)
        {
            return BadRequest("The harvest must be marked Harvested before editing its result.");
        }

        var updated = await harvestResultRepository.UpdateAsync(result);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestResultRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
