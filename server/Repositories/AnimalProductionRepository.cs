using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class AnimalProductionRepository(AppDbContext context) : IAnimalProductionRepository
{
    public async Task<IEnumerable<AnimalProduction>> GetAllAsync()
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<AnimalProduction>> GetByAnimalAsync(int animalId)
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .Where(p => p.AnimalId == animalId)
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<AnimalProduction>> GetByLivestockAsync(int livestockId)
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .Where(p => p.LivestockId == livestockId)
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

    public async Task<AnimalProduction?> GetByIdAsync(int id)
    {
        return await context.AnimalProductions.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> ExistsForLivestockAsync(int livestockId)
    {
        var animalIds = context.LivestockDetails
            .Where(d => d.LivestockId == livestockId)
            .Select(d => d.Id);

        return await context.AnimalProductions
            .AnyAsync(p => p.LivestockId == livestockId || (p.AnimalId != null && animalIds.Contains(p.AnimalId.Value)));
    }

    public async Task<bool> ExistsForAnimalAsync(int animalId)
    {
        return await context.AnimalProductions.AnyAsync(p => p.AnimalId == animalId);
    }

    /// <summary>
    /// Moves the owning group's headcount by <paramref name="delta"/> for a realization — the
    /// animals such a record covers left the herd, so the count has to follow. Left tracked
    /// rather than read AsNoTracking, so it goes out with the caller's own SaveChangesAsync and
    /// the record and the count land in one write.
    /// </summary>
    private async Task ShiftHeadcountAsync(AnimalProduction production, int delta)
    {
        if (!production.IsRealization || production.LivestockId is not int groupId || delta == 0)
        {
            return;
        }

        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == groupId);
        if (group is null)
        {
            return;
        }

        // The controller already refuses to realize more animals than the group has. The clamp is
        // for the gap between that check and this write — a herd stuck at zero is recoverable,
        // a negative one is not.
        group.Count = Math.Max(0, group.Count + delta);

        // And the ledger says why it moved. Added to the same context, so it goes out with the
        // caller's SaveChangesAsync alongside the record and the count — a realization that left
        // no entry would leave the group's own account of itself unable to explain its count.
        context.LivestockMovements.Add(new LivestockMovement
        {
            LivestockId = groupId,
            Delta = delta,
            Source = LivestockMovementSource.Realization,
            Date = DateOnly.FromDateTime(production.CollectionDate),
        });
    }

    public async Task<AnimalProduction> AddAsync(AnimalProduction production)
    {
        context.AnimalProductions.Add(production);
        await ShiftHeadcountAsync(production, -production.AnimalCount);
        await context.SaveChangesAsync();
        return production;
    }

    public async Task<bool> UpdateAsync(AnimalProduction production)
    {
        var existing = await context.AnimalProductions.FindAsync(production.Id);
        if (existing is null)
        {
            return false;
        }

        // Before AnimalCount is overwritten: a realization edited from 3 head to 5 takes two more
        // animals out of the herd. IsRealization itself is deliberately not copied below, so a
        // record cannot be turned into a realization — or out of one — by an edit.
        await ShiftHeadcountAsync(existing, existing.AnimalCount - production.AnimalCount);

        existing.AnimalCount = production.AnimalCount;
        existing.ProductionTypeId = production.ProductionTypeId;
        existing.CollectionDate = production.CollectionDate;
        existing.Quantity = production.Quantity;
        existing.UnitId = production.UnitId;
        existing.Quality = production.Quality;
        existing.PricePerUnit = production.PricePerUnit;
        existing.TotalPrice = production.TotalPrice;
        existing.CollectedBy = production.CollectedBy;
        existing.BatchNumber = production.BatchNumber;
        existing.Notes = production.Notes;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.AnimalProductions.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Removing a realization puts its animals back: the record was the only thing saying they
        // had left the herd.
        await ShiftHeadcountAsync(existing, existing.AnimalCount);

        context.AnimalProductions.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
