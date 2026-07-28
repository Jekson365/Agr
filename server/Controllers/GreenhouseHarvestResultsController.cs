using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseHarvestResultsController(
    IGreenhouseHarvestResultRepository greenhouseHarvestResultRepository,
    IGreenhouseHarvestRepository greenhouseHarvestRepository,
    IGreenhouseStockRepository greenhouseStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvestResult>>> GetByHarvest([FromQuery] int greenhouseHarvestId)
    {
        return Ok(await greenhouseHarvestResultRepository.GetByHarvestAsync(greenhouseHarvestId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseHarvestResult>> Create(GreenhouseHarvestResult result)
    {
        var invalid = await ValidateAsync(result, requireHarvested: true, harvestedMessage: "The harvest must be marked Harvested before recording its result.");
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var created = await greenhouseHarvestResultRepository.AddAsync(result);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseHarvestResult result)
    {
        if (id != result.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(result, requireHarvested: true, harvestedMessage: "The harvest must be marked Harvested before editing its result.");
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var updated = await greenhouseHarvestResultRepository.UpdateAsync(result);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseHarvestResultRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseHarvestResult result, bool requireHarvested, string harvestedMessage)
    {
        if (result.Amount < 0)
        {
            return "Amount cannot be negative.";
        }

        var harvest = await greenhouseHarvestRepository.GetByIdAsync(result.GreenhouseHarvestId);
        if (harvest is null)
        {
            return "That greenhouse harvest does not exist.";
        }
        if (requireHarvested && harvest.Status != HarvestStatus.Harvested)
        {
            return harvestedMessage;
        }

        var stock = await greenhouseStockRepository.GetByIdAsync(result.GreenhouseStockId);
        if (stock is null)
        {
            return "That greenhouse stock does not exist.";
        }
        if (stock.GreenhouseId != harvest.GreenhouseId)
        {
            return "That stock does not belong to this harvest's greenhouse.";
        }

        return null;
    }
}
