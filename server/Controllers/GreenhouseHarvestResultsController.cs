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
    /// <summary>
    /// A good is recorded once per harvest: how much of it came off is one number, so a second row
    /// for the same stock would be a second answer — and both would be added to its balance. Change
    /// the first row instead.
    /// </summary>
    private const string AlreadyRecordedMessage = "This harvest already records a result for that stock.";

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

        if (await greenhouseHarvestResultRepository.ExistsForHarvestAsync(result.GreenhouseHarvestId, result.GreenhouseStockId))
        {
            return Conflict(AlreadyRecordedMessage);
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

        var existing = await greenhouseHarvestResultRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // The harvest a row belongs to is fixed once created, so that's the harvest the good has to
        // be unrecorded in — not whatever harvest the request happens to name.
        if (await greenhouseHarvestResultRepository.ExistsForHarvestAsync(existing.GreenhouseHarvestId, result.GreenhouseStockId, id))
        {
            return Conflict(AlreadyRecordedMessage);
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
