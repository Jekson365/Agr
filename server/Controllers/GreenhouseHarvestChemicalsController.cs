using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseHarvestChemicalsController(
    IGreenhouseHarvestChemicalRepository greenhouseHarvestChemicalRepository,
    IGreenhouseHarvestRepository greenhouseHarvestRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseHarvestChemical>>> GetByHarvest([FromQuery] int greenhouseHarvestId)
    {
        return Ok(await greenhouseHarvestChemicalRepository.GetByHarvestAsync(greenhouseHarvestId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseHarvestChemical>> Create(GreenhouseHarvestChemical chemical)
    {
        var invalid = await ValidateAsync(chemical);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        chemical.Name = chemical.Name.Trim();
        return Ok(await greenhouseHarvestChemicalRepository.AddAsync(chemical));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseHarvestChemical chemical)
    {
        if (id != chemical.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(chemical);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        chemical.Name = chemical.Name.Trim();
        var updated = await greenhouseHarvestChemicalRepository.UpdateAsync(chemical);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseHarvestChemicalRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseHarvestChemical chemical)
    {
        if (string.IsNullOrWhiteSpace(chemical.Name))
        {
            return "Name is required.";
        }
        if (chemical.Cost < 0)
        {
            return "Cost can't be negative.";
        }
        if (await greenhouseHarvestRepository.GetByIdAsync(chemical.GreenhouseHarvestId) is null)
        {
            return "That greenhouse harvest does not exist.";
        }
        return null;
    }
}
