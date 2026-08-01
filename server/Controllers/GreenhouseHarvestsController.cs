using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseHarvestsController(
    IGreenhouseHarvestRepository greenhouseHarvestRepository,
    IGreenhouseRepository greenhouseRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvest>>> GetAll([FromQuery] int? greenhouseId)
    {
        return Ok(await greenhouseHarvestRepository.GetAllAsync(greenhouseId));
    }

    /// <summary>
    /// One greenhouse's harvests with the yield each recorded, newest first — what the greenhouse
    /// page lists, in one call instead of a list plus a results request per row. Capped at
    /// <paramref name="limit"/> (10 by default), with the filters applied before the cap so they
    /// search the whole history rather than the ten already on screen.
    /// </summary>
    [HttpGet("summaries")]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvestSummary>>> GetSummaries(
        [FromQuery] int greenhouseId,
        [FromQuery] HarvestStatus? status,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int limit = 10)
    {
        // A page asking for everything is a page that has stopped paging, so the cap is the
        // server's to set, not the caller's.
        var capped = Math.Clamp(limit, 1, 50);
        return Ok(await greenhouseHarvestRepository.GetSummariesAsync(greenhouseId, status, from, to, capped));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GreenhouseHarvest>> GetById(int id)
    {
        var harvest = await greenhouseHarvestRepository.GetByIdAsync(id);
        return harvest is null ? NotFound() : Ok(harvest);
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseHarvest>> Create(GreenhouseHarvest harvest)
    {
        var invalid = await ValidateAsync(harvest);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        harvest.Title = harvest.Title.Trim();
        var created = await greenhouseHarvestRepository.AddAsync(harvest);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseHarvest harvest)
    {
        if (id != harvest.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(harvest);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        harvest.Title = harvest.Title.Trim();
        var updated = await greenhouseHarvestRepository.UpdateAsync(harvest);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseHarvestRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseHarvest harvest)
    {
        if (string.IsNullOrWhiteSpace(harvest.Title))
        {
            return "A harvest needs a title.";
        }
        if (harvest.Date == default)
        {
            return "A harvest needs a date.";
        }
        if (!Enum.IsDefined(harvest.Status))
        {
            return "Unknown harvest status.";
        }
        // The greenhouse is what the harvest belongs to, so an unknown one would orphan it.
        if (await greenhouseRepository.GetByIdAsync(harvest.GreenhouseId) is null)
        {
            return "That greenhouse does not exist.";
        }
        if (harvest.EquipmentCost < 0 || harvest.WorkersCost < 0 || harvest.FuelCost < 0 || harvest.OtherCost < 0)
        {
            return "Costs cannot be negative.";
        }
        if (harvest.Revenue < 0)
        {
            return "Revenue cannot be negative.";
        }
        return null;
    }
}
