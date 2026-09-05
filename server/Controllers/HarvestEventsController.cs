using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestEventsController(IHarvestEventRepository harvestEventRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestEvent>>> GetByHarvest([FromQuery] int? harvestId)
    {
        return Ok(await harvestEventRepository.GetAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestEvent>> Create(HarvestEvent harvestEvent)
    {
        if (string.IsNullOrWhiteSpace(harvestEvent.Description))
        {
            return BadRequest("Description is required.");
        }

        return Ok(await harvestEventRepository.AddAsync(harvestEvent));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestEvent harvestEvent)
    {
        if (id != harvestEvent.Id)
        {
            return BadRequest();
        }
        if (string.IsNullOrWhiteSpace(harvestEvent.Description))
        {
            return BadRequest("Description is required.");
        }

        var updated = await harvestEventRepository.UpdateAsync(harvestEvent);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestEventRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
