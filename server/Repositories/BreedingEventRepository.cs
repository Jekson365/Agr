using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class BreedingEventRepository(AppDbContext context) : IBreedingEventRepository
{
    public async Task<IEnumerable<BreedingEvent>> GetAllAsync()
    {
        return await context.BreedingEvents
            .AsNoTracking()
            .OrderByDescending(b => b.BreedingDate)
            .ThenByDescending(b => b.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<BreedingEvent>> GetByLivestockAsync(int livestockId)
    {
        return await context.BreedingEvents
            .AsNoTracking()
            .Where(b => b.LivestockId == livestockId)
            // Newest pairing first, and the id breaks ties so two events on one day keep a stable
            // order rather than swapping places between loads.
            .OrderByDescending(b => b.BreedingDate)
            .ThenByDescending(b => b.Id)
            .ToListAsync();
    }

    public async Task<BreedingEvent?> GetByIdAsync(int id)
    {
        return await context.BreedingEvents.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
    }

    /// <summary>
    /// The stages an event can sit at while it is still running. Completed and Failed are both
    /// endings, and free the female to be paired again.
    /// </summary>
    public static bool IsOpen(BreedingStatus status) =>
        status is BreedingStatus.Breeding or BreedingStatus.PregnancyConfirmed;

    public async Task<bool> HasOpenEventForFemaleAsync(int femaleAnimalId, int? excludeId = null)
    {
        return await context.BreedingEvents.AnyAsync(b =>
            b.FemaleAnimalId == femaleAnimalId
            && (excludeId == null || b.Id != excludeId)
            && (b.Status == BreedingStatus.Breeding || b.Status == BreedingStatus.PregnancyConfirmed));
    }

    public async Task<BreedingEvent> AddAsync(BreedingEvent breedingEvent)
    {
        context.BreedingEvents.Add(breedingEvent);
        await context.SaveChangesAsync();
        return breedingEvent;
    }

    public async Task<bool> UpdateAsync(BreedingEvent breedingEvent)
    {
        var existing = await context.BreedingEvents.FindAsync(breedingEvent.Id);
        if (existing is null)
        {
            return false;
        }

        existing.LivestockId = breedingEvent.LivestockId;
        existing.MaleAnimalId = breedingEvent.MaleAnimalId;
        existing.FemaleAnimalId = breedingEvent.FemaleAnimalId;
        existing.BreedingDate = breedingEvent.BreedingDate;
        existing.Comment = breedingEvent.Comment;
        existing.Status = breedingEvent.Status;
        // OffspringCount and OffspringLivestockId are deliberately not copied — they are the
        // event's record of what it produced, written only by AddOffspringAsync, and an edit of
        // its date or comment has nothing to say about them.
        // The stage dates are worked out by the controller from the status it is moving to, and
        // arrive here already settled — copied rather than recomputed so this stays the one place
        // that writes the row.
        existing.PregnancyConfirmedDate = breedingEvent.PregnancyConfirmedDate;
        existing.CompletedDate = breedingEvent.CompletedDate;
        existing.FailedDate = breedingEvent.FailedDate;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddOffspringAsync(int id, int quantity, int livestockId)
    {
        var existing = await context.BreedingEvents.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Added to, not replaced: a pairing can be recorded as producing more than once.
        existing.OffspringCount += quantity;
        existing.OffspringLivestockId = livestockId;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.BreedingEvents.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.BreedingEvents.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
