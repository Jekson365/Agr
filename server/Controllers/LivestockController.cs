using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockController(
    ILivestockRepository livestockRepository,
    IAnimalProductionRepository animalProductionRepository,
    IProductionTypeRepository productionTypeRepository,
    ILivestockMovementRepository livestockMovementRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    private const string ProduceSettledMessage = "What this group produces is already set and can no longer change.";

    /// <summary>
    /// What a group is made of is settled when it is created: its animals, its production history
    /// and everything reported off them were recorded as that kind, so changing it would restate
    /// all of it as another animal. A different kind is a different group.
    /// </summary>
    private const string TypeSettledMessage = "A livestock group keeps the type it was created with.";

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
        if (await livestockRepository.ExistsByNameAsync(livestock.Name.Trim()))
        {
            return Conflict("A livestock group with this name already exists.");
        }

        try
        {
            var currentCount = (await livestockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddLivestockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        // The group is created empty and its opening count arrives as the first movement, rather
        // than being set here and logged as well — that would count it twice, since a movement
        // moves the count. It also means the ledger accounts for every animal the group has,
        // starting from zero rather than from an unexplained number.
        var openingCount = livestock.Count;
        livestock.Count = 0;
        var created = await livestockRepository.AddAsync(livestock);

        if (openingCount > 0)
        {
            await livestockMovementRepository.AddAsync(new LivestockMovement
            {
                LivestockId = created.Id,
                Delta = openingCount,
                Source = LivestockMovementSource.Manual,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
            });
            // The row now holds it; carry it back so the caller sees the group it asked for.
            created.Count = openingCount;
        }

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Livestock livestock)
    {
        if (id != livestock.Id)
        {
            return BadRequest();
        }

        // No name check here: the name is settled at creation and the repository ignores whatever
        // arrives on an update, so an edit cannot collide with another group however it is spelled.
        var existing = await livestockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (!string.Equals(existing.Type.Trim(), livestock.Type.Trim(), StringComparison.Ordinal))
        {
            return Conflict(TypeSettledMessage);
        }

        // What a group produces is settled when it is created, declared or not. The records it has
        // collected are counted under it, so pointing it at another output would recount them as
        // something they were never collected as — and a group created without one stays without
        // one rather than acquiring a history retrospectively.
        //
        // A request that omits the field leaves whatever is there standing rather than clearing
        // it, so a client that predates it can still edit the name.
        if (livestock.ProductionTypeId is int requested && requested != existing.ProductionTypeId)
        {
            return Conflict(ProduceSettledMessage);
        }
        livestock.ProductionTypeId = existing.ProductionTypeId;

        try
        {
            var currentCount = (await livestockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureLivestockWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var updated = await livestockRepository.UpdateAsync(livestock);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Production records cascade with the group, which would erase that history from every
        // past report while any sales deducted from it survive — leaving balances negative with
        // no way to correct them. Refuse instead, so the records are removed deliberately.
        if (await animalProductionRepository.ExistsForLivestockAsync(id))
        {
            return Conflict("This group still has production records. Remove them first.");
        }

        // Read before the group goes: its meat is the one production type that exists only
        // because this group did, so it leaves with it rather than sitting in the catalog as an
        // output for an animal the farm no longer keeps.
        var meatProductionTypeId = (await livestockRepository.GetByIdAsync(id))?.MeatProductionTypeId;

        var deleted = await livestockRepository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        if (meatProductionTypeId is int meatTypeId)
        {
            // After the group, never before: the FK from Livestock to ProductionType is Restrict,
            // so while the group is still there its meat cannot go anywhere.
            //
            // A realization recorded before the group was emptied still points at its meat, and
            // another group could have been pointed at the same row. DeleteAsync already refuses
            // in both cases and reports InUse rather than throwing, so this asks and accepts the
            // answer.
            await productionTypeRepository.DeleteAsync(meatTypeId);
        }

        return NoContent();
    }
}
