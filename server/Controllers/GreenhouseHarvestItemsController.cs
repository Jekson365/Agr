using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseHarvestItemsController(
    IGreenhouseHarvestItemRepository greenhouseHarvestItemRepository,
    IGreenhouseHarvestRepository greenhouseHarvestRepository,
    IGreenhouseStockRepository greenhouseStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvestItem>>> GetByHarvest([FromQuery] int greenhouseHarvestId)
    {
        return Ok(await greenhouseHarvestItemRepository.GetByHarvestAsync(greenhouseHarvestId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseHarvestItem>> Create(GreenhouseHarvestItem item)
    {
        var invalid = await ValidateAsync(item);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var created = await greenhouseHarvestItemRepository.AddAsync(item);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseHarvestItem item)
    {
        if (id != item.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(item);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var updated = await greenhouseHarvestItemRepository.UpdateAsync(item);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseHarvestItemRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseHarvestItem item)
    {
        if (item.Amount < 0)
        {
            return "Amount cannot be negative.";
        }

        var harvest = await greenhouseHarvestRepository.GetByIdAsync(item.GreenhouseHarvestId);
        if (harvest is null)
        {
            return "That greenhouse harvest does not exist.";
        }

        var stock = await greenhouseStockRepository.GetByIdAsync(item.GreenhouseStockId);
        if (stock is null)
        {
            return "That greenhouse stock does not exist.";
        }

        // The greenhouse a good is recorded under says where it is kept, not which harvests may
        // count it: a good added anywhere is a good the farm grows under glass, so any greenhouse's
        // plan can name it.
        return null;
    }
}
