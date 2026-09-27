using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public partial class BreedingEventsController(
    IBreedingEventRepository breedingEventRepository,
    ILivestockRepository livestockRepository,
    ILivestockDetailRepository livestockDetailRepository,
    ILivestockMovementRepository livestockMovementRepository) : ControllerBase
{
    /// <summary>
    /// A female stays tied to a pairing until it ends. Breeding and PregnancyConfirmed are both
    /// open — one is waiting on the outcome, the other is carrying — so neither frees her.
    /// </summary>
    private const string FemaleUnavailableMessage = "This female is already in an unfinished pairing.";

    /// <summary>A pairing produces its litter once, so its result is recorded once.</summary>
    private const string ResultAlreadyRecordedMessage = "A result has already been recorded for this pairing.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BreedingEvent>>> Get([FromQuery] int? livestockId)
    {
        var events = livestockId is int groupId
            ? await breedingEventRepository.GetByLivestockAsync(groupId)
            : await breedingEventRepository.GetAllAsync();
        return Ok(events);
    }

    [HttpPost]
    public async Task<ActionResult<BreedingEvent>> Create(BreedingEvent breedingEvent)
    {
        if (breedingEvent.MaleAnimalId is null || breedingEvent.FemaleAnimalId is null)
        {
            return BadRequest("A breeding event pairs two animals.");
        }

        if (breedingEvent.MaleAnimalId == breedingEvent.FemaleAnimalId)
        {
            return BadRequest("An animal cannot be paired with itself.");
        }

        if (await livestockRepository.IsDeletedAsync(breedingEvent.LivestockId, breedingEvent.MaleAnimalId, breedingEvent.FemaleAnimalId))
        {
            return Conflict(LivestockController.DeletedMessage);
        }

        // A female already carrying — or waiting on the outcome of an earlier pairing — cannot be
        // paired again until that event ends. Checked here and not only in the picker, because the
        // pairing that occupies her may have been recorded from another group's page.
        if (await breedingEventRepository.HasOpenEventForFemaleAsync(breedingEvent.FemaleAnimalId.Value))
        {
            return Conflict(FemaleUnavailableMessage);
        }

        breedingEvent.CreatedAt = DateTime.UtcNow;

        // A stage the event has not reached carries no date. Only the one it is created at gets
        // one, from the client if it named a day and from today if it did not.
        StampStageDate(breedingEvent, breedingEvent.Status);

        return Ok(await breedingEventRepository.AddAsync(breedingEvent));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, BreedingEvent breedingEvent)
    {
        if (id != breedingEvent.Id)
        {
            return BadRequest();
        }

        var existing = await breedingEventRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (breedingEvent.MaleAnimalId is not null
            && breedingEvent.MaleAnimalId == breedingEvent.FemaleAnimalId)
        {
            return BadRequest("An animal cannot be paired with itself.");
        }

        // Excluding this event: it is allowed to be the one holding her, which is exactly the case
        // when its own status or dates are being edited. Only a second open pairing is refused.
        if (breedingEvent.FemaleAnimalId is int femaleId
            && await breedingEventRepository.HasOpenEventForFemaleAsync(femaleId, id))
        {
            return Conflict(FemaleUnavailableMessage);
        }

        // A date the caller gave stands; anything it left out falls back to what the event already
        // holds. That keeps the stamps of stages it has been through — an event that went
        // Breeding → PregnancyConfirmed → Failed still says when the pregnancy was confirmed and
        // when it failed — while letting a stage's date be corrected without moving the event.
        breedingEvent.PregnancyConfirmedDate ??= existing.PregnancyConfirmedDate;
        breedingEvent.CompletedDate ??= existing.CompletedDate;
        breedingEvent.FailedDate ??= existing.FailedDate;

        if (breedingEvent.Status != existing.Status)
        {
            StampStageDate(breedingEvent, breedingEvent.Status);
        }

        var updated = await breedingEventRepository.UpdateAsync(breedingEvent);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await breedingEventRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// The fallback date for the stage just reached, used only when the caller named none. The
    /// day a stage was reached is the farmer's to give — a pregnancy is routinely confirmed before
    /// anyone opens the app — so this fills a gap rather than overriding an answer.
    ///
    /// <see cref="BreedingStatus.Breeding"/> has no stamp of its own: its date is
    /// <see cref="BreedingEvent.BreedingDate"/>, which is always given.
    /// </summary>
    private static void StampStageDate(BreedingEvent breedingEvent, BreedingStatus status)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        switch (status)
        {
            case BreedingStatus.PregnancyConfirmed:
                breedingEvent.PregnancyConfirmedDate ??= today;
                break;
            case BreedingStatus.Completed:
                breedingEvent.CompletedDate ??= today;
                break;
            case BreedingStatus.Failed:
                breedingEvent.FailedDate ??= today;
                break;
        }
    }
}
