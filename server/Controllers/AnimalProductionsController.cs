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
    /// A realization takes its animals out of the group (see
    /// <see cref="AnimalProduction.IsRealization"/>), so it cannot cover more than the group has.
    /// </summary>
    private const string NotEnoughAnimalsMessage = "The group does not have that many animals left.";


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
            // A realization is an act on the herd — it takes animals out of a group — so it is
            // recorded against the group, never against one animal of it.
            if (production.LivestockId is not int groupId)
            {
                return BadRequest("A realization is recorded against a group, not a single animal.");
            }

            var group = await livestockRepository.GetByIdAsync(groupId);
            if (group is null)
            {
                return NotFound();
            }

            if (production.AnimalCount < 1)
            {
                return BadRequest("A realization covers at least one animal.");
            }

            if (production.AnimalCount > group.Count)
            {
                return Conflict(NotEnoughAnimalsMessage);
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

        if (existing.IsRealization)
        {
            if (production.AnimalCount < 1)
            {
                return BadRequest("A realization covers at least one animal.");
            }

            // Only the difference is taken from the herd — the animals this record already
            // accounts for left it when it was saved. Raising 3 head to 5 needs 2 more to exist.
            var additional = production.AnimalCount - existing.AnimalCount;
            if (additional > 0
                && existing.LivestockId is int groupId
                && await livestockRepository.GetByIdAsync(groupId) is Livestock group
                && additional > group.Count)
            {
                return Conflict(NotEnoughAnimalsMessage);
            }
        }
        // Only a change of type is judged, and against the owner the row actually has: a record
        // collected under something else before its group declared an output keeps that type, so
        // editing its quantity doesn't turn into a fight over what it was collected as. A
        // realization is exempt for the same reason it is on create — it names the group's meat.
        else if (production.ProductionTypeId != existing.ProductionTypeId
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
