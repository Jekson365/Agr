using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BreedingEventsController(
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

    /// <summary>What a pairing produced: the animals it brought into a group.</summary>
    public record BreedingResultRequest(
        int LivestockId,
        int Quantity,
        Gender? Gender,
        string? ImagePath,
        DateOnly? BornDate,
        bool AddIndividuals);

    /// <summary>
    /// Records what a pairing produced, once. The receiving group's head count always rises by the
    /// quantity; whether each animal also gets a row of its own is the caller's choice.
    ///
    /// A row per animal is what per-animal production, breeding and parentage need to work with,
    /// but it is not always wanted — a farmer who does not tag their chicks has no use for forty
    /// records of them. Without it the offspring are counted and nothing more.
    ///
    /// Its own endpoint rather than a series of ordinary detail creates: the animals and the count
    /// have to move together, and the parents come from the event rather than from the caller.
    /// </summary>
    [HttpPost("{id:int}/result")]
    public async Task<ActionResult<IEnumerable<LivestockDetail>>> RecordResult(int id, BreedingResultRequest request)
    {
        var breedingEvent = await breedingEventRepository.GetByIdAsync(id);
        if (breedingEvent is null)
        {
            return NotFound();
        }

        if (request.Quantity < 1)
        {
            return BadRequest("A result covers at least one animal.");
        }

        var group = await livestockRepository.GetByIdAsync(request.LivestockId);
        if (group is null)
        {
            return NotFound();
        }

        // What this pairing produced, kept on the event so its row can say so — and the gate on
        // the rest of this method. A pairing has one outcome, so a second result is refused here,
        // before anything is created: a repeat would otherwise raise the head count twice and tag
        // a second litter that was never born.
        if (!await breedingEventRepository.SetResultAsync(id, request.Quantity, request.LivestockId))
        {
            return Conflict(ResultAlreadyRecordedMessage);
        }

        // Either way the herd grew, and it grew by birth. The movement is what moves the count.
        await livestockMovementRepository.AddAsync(new LivestockMovement
        {
            LivestockId = request.LivestockId,
            Delta = request.Quantity,
            Source = LivestockMovementSource.Birth,
            Date = request.BornDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
        });

        if (!request.AddIndividuals)
        {
            // Counted, not written down. Nothing here carries the parentage — there is no row to
            // carry it on — so the pairing's own record stays the only account of them.
            return Ok(Array.Empty<LivestockDetail>());
        }

        var template = new LivestockDetail
        {
            LivestockId = request.LivestockId,
            ImagePath = request.ImagePath ?? string.Empty,
            BornDate = request.BornDate,
            Gender = request.Gender,
            // Taken from the event, not the request: these are the animals that bred, and letting
            // a caller name someone else's would make the parentage a claim rather than a record.
            ParentOneId = breedingEvent.MaleAnimalId,
            ParentTwoId = breedingEvent.FemaleAnimalId,
        };

        var created = await livestockDetailRepository.AddOffspringAsync(template, request.Quantity, CodePrefix(breedingEvent));
        return Ok(created);
    }

    /// <summary>
    /// What the offspring's tags are built from — the dam's code where there is one, else the
    /// sire's, so a litter reads as belonging to the pairing it came from. "N" (for new) covers a
    /// pairing whose animals have both since been removed.
    /// </summary>
    private static string CodePrefix(BreedingEvent breedingEvent) =>
        breedingEvent.FemaleAnimalId is int female
            ? $"F{female}"
            : breedingEvent.MaleAnimalId is int male
                ? $"M{male}"
                : "N";

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
