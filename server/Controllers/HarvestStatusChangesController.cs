using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestStatusChangesController(IHarvestStatusChangeRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestStatusChange>>> GetByHarvest([FromQuery] int? harvestId)
    {
        return Ok(await repository.GetAsync(harvestId));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestStatusChange change)
    {
        if (id != change.Id)
        {
            return BadRequest();
        }

        var updated = await repository.UpdateAsync(change);
        return updated ? NoContent() : NotFound();
    }
}
