using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

public partial class BreedingEventsController
{
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

        if (group.IsDeleted)
        {
            return Conflict(LivestockController.DeletedMessage);
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
}
