using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestChemicalsController(IHarvestChemicalRepository harvestChemicalRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestChemical>>> GetByHarvest([FromQuery] int harvestId)
    {
        return Ok(await harvestChemicalRepository.GetByHarvestAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestChemical>> Create(HarvestChemical harvestChemical)
    {
        if (string.IsNullOrWhiteSpace(harvestChemical.Name))
        {
            return BadRequest("Name is required.");
        }
        if (harvestChemical.Cost < 0)
        {
            return BadRequest("Cost can't be negative.");
        }

        return Ok(await harvestChemicalRepository.AddAsync(harvestChemical));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestChemical harvestChemical)
    {
        if (id != harvestChemical.Id)
        {
            return BadRequest();
        }
        if (string.IsNullOrWhiteSpace(harvestChemical.Name))
        {
            return BadRequest("Name is required.");
        }
        if (harvestChemical.Cost < 0)
        {
            return BadRequest("Cost can't be negative.");
        }

        var updated = await harvestChemicalRepository.UpdateAsync(harvestChemical);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestChemicalRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
