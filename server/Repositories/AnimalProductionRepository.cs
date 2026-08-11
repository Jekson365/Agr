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
    /// Marks the owning group realized, or takes the mark off it. The head count is untouched —
    /// realizing a group says something about it rather than emptying it (see
    /// <see cref="Livestock.IsRealized"/>). Left tracked rather than read AsNoTracking, so it goes
    /// out with the caller's own SaveChangesAsync and the record and the mark land in one write.
    /// </summary>
    private async Task SetRealizedAsync(int groupId, bool realized)
    {
        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == groupId);
        if (group is not null)
        {
            group.IsRealized = realized;
        }
    }

    public async Task<AnimalProduction> AddAsync(AnimalProduction production)
    {
        context.AnimalProductions.Add(production);
        if (production.IsRealization && production.LivestockId is int groupId)
        {
            await SetRealizedAsync(groupId, true);
        }

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

        // Nothing to keep in step on an edit: the group's mark doesn't count animals, so a
        // realization changed from 3 head to 5 leaves an already-realized group as it is.
        // IsRealization itself is deliberately not copied below, so a record cannot be turned into
        // a realization — or out of one — by an edit.
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

        // The mark stands on the records that justify it: with this one gone, and no other
        // realization left on the group, nothing says it was realized any more. Asked of the
        // records rather than counted on the group, so a group realized twice keeps its mark until
        // the last of them is removed.
        if (existing.IsRealization && existing.LivestockId is int groupId)
        {
            var othersRemain = await context.AnimalProductions
                .AnyAsync(p => p.Id != existing.Id && p.LivestockId == groupId && p.IsRealization);
            if (!othersRemain)
            {
                await SetRealizedAsync(groupId, false);
            }
        }

        context.AnimalProductions.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
