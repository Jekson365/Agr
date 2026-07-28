using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SeedsController(
    ISeedRepository seedRepository,
    IHarvestSeedRepository harvestSeedRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Seed>>> GetAll()
    {
        return Ok(await seedRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Seed>> GetById(int id)
    {
        var seed = await seedRepository.GetByIdAsync(id);
        return seed is null ? NotFound() : Ok(seed);
    }

    [HttpPost]
    public async Task<ActionResult<Seed>> Create(Seed seed)
    {
        if (string.IsNullOrWhiteSpace(seed.Type))
        {
            return BadRequest("A seed needs a crop type.");
        }

        var created = await seedRepository.AddAsync(seed);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Seed seed)
    {
        if (id != seed.Id)
        {
            return BadRequest();
        }

        var updated = await seedRepository.UpdateAsync(seed);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Its usage rows cascade with it, which would silently rewrite what those harvests say
        // was sown — refuse instead, matching how a livestock group with production behaves.
        if (await harvestSeedRepository.ExistsForSeedAsync(id))
        {
            return Conflict("This seed is still recorded as sown on a harvest.");
        }

        var deleted = await seedRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
