using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockController(ILivestockRepository livestockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Livestock>>> GetAll()
    {
        return Ok(await livestockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Livestock>> GetById(int id)
    {
        var livestock = await livestockRepository.GetByIdAsync(id);
        return livestock is null ? NotFound() : Ok(livestock);
    }

    [HttpPost]
    public async Task<ActionResult<Livestock>> Create(Livestock livestock)
    {
        var created = await livestockRepository.AddAsync(livestock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Livestock livestock)
    {
        if (id != livestock.Id)
        {
            return BadRequest();
        }

        var updated = await livestockRepository.UpdateAsync(livestock);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await livestockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
