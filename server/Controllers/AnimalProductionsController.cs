using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnimalProductionsController(IAnimalProductionRepository animalProductionRepository) : ControllerBase
{
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

        // The client sends a plain date (Kind=Unspecified), but Npgsql requires Kind=Utc for
        // "timestamp with time zone" columns.
        production.CollectionDate = DateTime.SpecifyKind(production.CollectionDate, DateTimeKind.Utc);

        var updated = await animalProductionRepository.UpdateAsync(production);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await animalProductionRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
