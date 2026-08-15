using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnimalProductionsController(
    IAnimalProductionRepository animalProductionRepository,
    ILivestockRepository livestockRepository,
    ILivestockDetailRepository livestockDetailRepository) : ControllerBase
{
    /// <summary>
    /// A batch is collected under what its group produces — that is declared once on the group
    /// (see <see cref="Livestock.ProductionTypeId"/>), not chosen again per record.
    /// </summary>
    private const string ProduceMismatchMessage = "A record is collected under what its group produces.";

    /// <summary>
    /// A realization is one animal's: it is recorded from that animal, for the meat taken off it.
    /// A whole herd is realized by recording each of its animals, not by naming a number here.
    /// </summary>
    private const string OneAnimalMessage = "A realization covers exactly one animal.";

    /// <summary>The animal it was taken from is what a realization is recorded against — it is
    /// that animal's last entry, and what marks it realized.</summary>
    private const string RealizationNeedsAnimalMessage = "A realization is recorded against the animal it was taken from.";

    /// <summary>An animal is realized once. Its record is what says so, so a second would be
    /// claiming the same animal twice.</summary>
    private const string AlreadyRealizedMessage = "This animal has already been realized.";


    [HttpGet]
    public async Task<ActionResult<IEnumerable<AnimalProduction>>> Get([FromQuery] int? animalId, [FromQuery] int? livestockId)
    {
        if (animalId is not null && livestockId is not null)
        {
            return BadRequest("Provide at most one of animalId or livestockId.");
        }

        // Neither provided: return every production record for the tenant (used by the report screen).
        var records = animalId is not null
            ? await animalProductionRepository.GetByAnimalAsync(animalId.Value)
            : livestockId is not null
                ? await animalProductionRepository.GetByLivestockAsync(livestockId.Value)
                : await animalProductionRepository.GetAllAsync();
        return Ok(records);
    }

    [HttpPost]
    public async Task<ActionResult<AnimalProduction>> Create(AnimalProduction production)
    {
        if (production.AnimalId is null == production.LivestockId is null)
        {
            return BadRequest("Provide exactly one of animalId or livestockId.");
        }

        if (production.IsRealization)
        {
            // Recorded against the animal, not its group: it is that animal that was realized, and
            // this record is what marks it. Filed under the group's meat all the same — the meat is
            // the group's produce, whichever of its animals it came off.
            if (production.AnimalId is not int animalId)
            {
                return BadRequest(RealizationNeedsAnimalMessage);
            }

            if (await livestockDetailRepository.GetByIdAsync(animalId) is null)
            {
                return NotFound();
            }

            if (production.AnimalCount != 1)
            {
                return BadRequest(OneAnimalMessage);
            }

            if (await animalProductionRepository.ExistsRealizationForAnimalAsync(animalId))
            {
                return Conflict(AlreadyRealizedMessage);
            }
        }
        // A realization is collected under the group's meat, not under what it produces day to
        // day, so it is the one record that is allowed to name a different type.
        else if (await DeclaredProductionTypeAsync(production) is int declared && production.ProductionTypeId != declared)
        {
            return Conflict(ProduceMismatchMessage);
        }

        // The server owns the audit timestamp; CollectionDate is client-supplied.
        production.CreatedAt = DateTime.UtcNow;

        // The client sends a plain date (Kind=Unspecified), but Npgsql requires Kind=Utc for
        // "timestamp with time zone" columns.
        production.CollectionDate = DateTime.SpecifyKind(production.CollectionDate, DateTimeKind.Utc);

        var created = await animalProductionRepository.AddAsync(production);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, AnimalProduction production)
    {
        if (id != production.Id)
        {
            return BadRequest();
        }

        var existing = await animalProductionRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // Nothing to judge on a realization: it names the group's meat rather than what the group
        // produces, and the animal it covers is settled when it is recorded — the repository keeps
        // the count the row was saved with, so an edit cannot restate how many animals it was.
        //
        // Otherwise only a change of type is judged, and against the owner the row actually has: a
        // record collected under something else before its group declared an output keeps that
        // type, so editing its quantity doesn't turn into a fight over what it was collected as.
        if (!existing.IsRealization
            && production.ProductionTypeId != existing.ProductionTypeId
            && await DeclaredProductionTypeAsync(existing) is int declared
            && production.ProductionTypeId != declared)
        {
            return Conflict(ProduceMismatchMessage);
        }

        // The client sends a plain date (Kind=Unspecified), but Npgsql requires Kind=Utc for
        // "timestamp with time zone" columns.
        production.CollectionDate = DateTime.SpecifyKind(production.CollectionDate, DateTimeKind.Utc);

        var updated = await animalProductionRepository.UpdateAsync(production);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// What the group behind this record produces, or null when it hasn't declared one — a group
    /// recorded before the choice moved onto the group, which is free to keep collecting whatever
    /// its records name until it does. A single animal answers to its own group.
    /// </summary>
    private async Task<int?> DeclaredProductionTypeAsync(AnimalProduction production)
    {
        var livestockId = production.LivestockId;
        if (livestockId is null && production.AnimalId is int animalId)
        {
            livestockId = (await livestockDetailRepository.GetByIdAsync(animalId))?.LivestockId;
        }

        return livestockId is int groupId
            ? (await livestockRepository.GetByIdAsync(groupId))?.ProductionTypeId
            : null;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await animalProductionRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
