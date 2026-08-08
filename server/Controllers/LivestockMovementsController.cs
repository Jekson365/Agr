using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockMovementsController(
    ILivestockMovementRepository livestockMovementRepository,
    ILivestockRepository livestockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LivestockMovement>>> Get([FromQuery] int livestockId)
    {
        return Ok(await livestockMovementRepository.GetByLivestockAsync(livestockId));
    }

    [HttpPost]
    public async Task<ActionResult<LivestockMovement>> Create(LivestockMovement movement)
    {
        if (movement.Delta == 0)
        {
            return BadRequest("A movement covers at least one animal.");
        }

        var group = await livestockRepository.GetByIdAsync(movement.LivestockId);
        if (group is null)
        {
            return NotFound();
        }

        // A herd cannot lose more animals than it has. Only a removal is checked; an addition has
        // no ceiling.
        if (movement.Delta < 0 && -movement.Delta > group.Count)
        {
            return Conflict("The group does not have that many animals left.");
        }

        return Ok(await livestockMovementRepository.AddAsync(movement));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await livestockMovementRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
