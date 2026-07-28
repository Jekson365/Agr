using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestSeedsController(IHarvestSeedRepository harvestSeedRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestSeed>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestSeedRepository.GetByHarvestAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestSeed>> Create(HarvestSeed harvestSeed)
    {
        if (harvestSeed.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        return Ok(await harvestSeedRepository.AddAsync(harvestSeed));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestSeed harvestSeed)
    {
        if (id != harvestSeed.Id)
        {
            return BadRequest();
        }
        if (harvestSeed.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        var updated = await harvestSeedRepository.UpdateAsync(harvestSeed);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestSeedRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
