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
    ILivestockMovementRepository livestockMovementRepository,
    ILivestockDetailRepository livestockDetailRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    private const string ProduceSettledMessage = "What this group produces is already set and can no longer change.";
    private const string DeletedMessage = "This livestock group was removed.";

    /// <summary>
    /// What a group is made of is settled when it is created: its animals, its production history
    /// and everything reported off them were recorded as that kind, so changing it would restate
    /// all of it as another animal. A different kind is a different group.
    /// </summary>
    private const string TypeSettledMessage = "A livestock group keeps the type it was created with.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Livestock>>> GetAll([FromQuery] bool includeDeleted = false)
    {
        return Ok(await livestockRepository.GetAllAsync(includeDeleted));
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

            // And a row per animal, so the group starts out with something to point at. Every
            // per-animal feature — breeding, parentage, an animal's own production — needs these,
            // and forty ear tags typed by hand is not a way anyone starts.
            //
            // The count is deliberately not touched here: the movement above already accounts for
            // exactly these animals, and raising it again would count them twice. The codes are
            // built from the kind's initial, so a chicken group starts at C-1.
            var codePrefix = created.Type.Trim() is { Length: > 0 } type
                ? char.ToUpperInvariant(type[0]).ToString()
                : "A";
            await livestockDetailRepository.AddOffspringAsync(
                new LivestockDetail { LivestockId = created.Id },
                openingCount,
                codePrefix);
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

        // A removed group is kept only so the history collected from it still reads back; it is out
        // of use, so it takes no more edits.
        if (existing.IsDeleted)
        {
            return Conflict(DeletedMessage);
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

    /// <summary>
    /// Removes a group from the Livestock page. The row is marked deleted rather than dropped:
    /// every production collected from it, its animals and their records all cascade off it, so a
    /// real delete would erase that history from every past report while any sales deducted from it
    /// survive — leaving balances negative with no way to correct them. Hidden and out of use is all
    /// "removed" has to mean, which is also why production records no longer stand in the way.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await livestockRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        await livestockRepository.SoftDeleteAsync(id);

        // Its meat production type stays, as does everything collected under it. The group is still
        // there to reference it, so the Restrict FK would refuse anyway — and the realizations
        // recorded against it need it named to read back on the balance's removed holdings.
        return NoContent();
    }
}
