using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseHarvestSeedsController(
    IGreenhouseHarvestSeedRepository greenhouseHarvestSeedRepository,
    IGreenhouseHarvestRepository greenhouseHarvestRepository,
    IGreenhouseSeedRepository greenhouseSeedRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvestSeed>>> GetByHarvest([FromQuery] int greenhouseHarvestId)
    {
        return Ok(await greenhouseHarvestSeedRepository.GetByHarvestAsync(greenhouseHarvestId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseHarvestSeed>> Create(GreenhouseHarvestSeed harvestSeed)
    {
        var invalid = await ValidateAsync(harvestSeed);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        return Ok(await greenhouseHarvestSeedRepository.AddAsync(harvestSeed));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseHarvestSeed harvestSeed)
    {
        if (id != harvestSeed.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(harvestSeed);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var updated = await greenhouseHarvestSeedRepository.UpdateAsync(harvestSeed);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseHarvestSeedRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseHarvestSeed harvestSeed)
    {
        if (harvestSeed.Amount <= 0)
        {
            return "Amount must be positive.";
        }

        var harvest = await greenhouseHarvestRepository.GetByIdAsync(harvestSeed.GreenhouseHarvestId);
        if (harvest is null)
        {
            return "That greenhouse harvest does not exist.";
        }

        var seed = await greenhouseSeedRepository.GetByIdAsync(harvestSeed.GreenhouseSeedId);
        if (seed is null)
        {
            return "That greenhouse seed does not exist.";
        }

        // The greenhouse a seed is recorded under says where it is kept, not who may sow it: seed
        // added anywhere is seed the farm holds, so any greenhouse's harvest can draw on it.
        return null;
    }
}
