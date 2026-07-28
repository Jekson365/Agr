using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestTreesController(IHarvestTreeRepository harvestTreeRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestTree>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestTreeRepository.GetByHarvestAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestTree>> Create(HarvestTree harvestTree)
    {
        if (harvestTree.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        return Ok(await harvestTreeRepository.AddAsync(harvestTree));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestTree harvestTree)
    {
        if (id != harvestTree.Id)
        {
            return BadRequest();
        }
        if (harvestTree.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        var updated = await harvestTreeRepository.UpdateAsync(harvestTree);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestTreeRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
