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

        // A realization's entry is written with the animal's realization record, never by hand:
        // one entered here would take an animal off the herd with nothing realized to account
        // for it.
        if (movement.Source == LivestockMovementSource.Realization)
        {
            return BadRequest(RealizationEntryMessage);
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
        // And it is not removed by hand either: the realization record it belongs to takes it
        // back. Removing it here would put the animal back on the herd while it stayed realized.
        if (await livestockMovementRepository.GetByIdAsync(id) is LivestockMovement existing
            && existing.Source == LivestockMovementSource.Realization)
        {
            return Conflict(RealizationEntryMessage);
        }

        var deleted = await livestockMovementRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// Realization entries are owned by the realization records that wrote them — see
    /// <see cref="AnimalProduction.IsRealization"/>. They come and go with the record, so that the
    /// ledger and what has actually been realized cannot tell different stories.
    /// </summary>
    private const string RealizationEntryMessage =
        "A realization entry is written and removed with the animal's realization record.";
}
