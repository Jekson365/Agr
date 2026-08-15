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

    public async Task<bool> ExistsRealizationForAnimalAsync(int animalId)
    {
        return await context.AnimalProductions.AnyAsync(p => p.AnimalId == animalId && p.IsRealization);
    }

    /// <summary>The group the realized animal was kept in, or null for a record naming no animal
    /// or one that is no longer there.</summary>
    private async Task<int?> RealizedFromGroupAsync(AnimalProduction realization)
    {
        return realization.AnimalId is int animalId
            ? await context.LivestockDetails
                .Where(d => d.Id == animalId)
                .Select(d => (int?)d.LivestockId)
                .FirstOrDefaultAsync()
            : null;
    }

    /// <summary>
    /// The head-count entry a realization writes, added with the record itself so both land in one
    /// write: the animal leaves the group it was kept in, and the group's count goes with it.
    ///
    /// The meat needs no entry of its own. A realization is an <see cref="AnimalProduction"/> row
    /// like every other collection, and a produce balance is everything collected plus the
    /// movements logged against it — so the row is already what puts the meat in the balance, and
    /// a <see cref="ProductionMovement"/> beside it would count the same meat twice: on the
    /// balance page, and in how much the marketplace lets the farm sell.
    /// </summary>
    private async Task WriteRealizationHeadCountAsync(AnimalProduction realization)
    {
        if (await RealizedFromGroupAsync(realization) is not int livestockId)
        {
            return;
        }

        context.LivestockMovements.Add(new LivestockMovement
        {
            LivestockId = livestockId,
            Delta = -1,
            Source = LivestockMovementSource.Realization,
            Date = DateOnly.FromDateTime(realization.CollectionDate),
            CreatedAt = DateTime.UtcNow,
        });

        // Moved here rather than through LivestockMovementRepository so the entry and the count go
        // out with everything else. Clamped at zero for the same reason it is there: a herd stuck
        // at zero is recoverable, a negative one is not.
        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == livestockId);
        if (group is not null)
        {
            group.Count = Math.Max(0, group.Count - 1);
        }
    }

    /// <summary>
    /// The same entry, taken back with the record that wrote it. Removed rather than countered by
    /// a second entry: a realization entered by mistake and deleted did not happen, and a movement
    /// page carrying an animal out and back in reads as a herd that lost one and got it returned —
    /// which is a different story from the one the ledger is meant to tell. A rolled-back sale
    /// drops its <see cref="ProductionMovement"/> the same way, for the same reason.
    ///
    /// Found by what it was written from — the group, the day and the source — since nothing links
    /// the two rows. Two realizations of one group on one day write identical entries, so which of
    /// them goes is not a question the ledger can answer, or needs to.
    /// </summary>
    private async Task TakeBackRealizationHeadCountAsync(AnimalProduction realization)
    {
        if (await RealizedFromGroupAsync(realization) is not int livestockId)
        {
            return;
        }

        var date = DateOnly.FromDateTime(realization.CollectionDate);
        var entry = await context.LivestockMovements.FirstOrDefaultAsync(m =>
            m.LivestockId == livestockId
            && m.Source == LivestockMovementSource.Realization
            && m.Date == date
            && m.Delta == -1);
        if (entry is not null)
        {
            context.LivestockMovements.Remove(entry);
        }

        // The animal is back on the farm either way: the record that said otherwise is the one
        // being deleted, and a count left short of the herd is what the farmer would have to
        // correct by hand.
        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == livestockId);
        if (group is not null)
        {
            group.Count += 1;
        }
    }

    public async Task<AnimalProduction> AddAsync(AnimalProduction production)
    {
        context.AnimalProductions.Add(production);
        if (production.IsRealization)
        {
            await WriteRealizationHeadCountAsync(production);
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

        // IsRealization is deliberately not copied below, so a record cannot be turned into a
        // realization — or out of one — by an edit.
        //
        // A realization keeps what it was filed under and what its head-count entry was written
        // from: the animal it covers, the group's meat and the unit it was weighed in, the day the
        // herd lost it, and the one animal it stands for. An edit here cannot reach that entry, so
        // restating the day would leave the record and the ledger saying different things — a
        // wrong one is deleted and recorded again, which takes the entry back with it.
        //
        // The weight is not one of those. It is read off a scale and can simply be wrong, and the
        // produce balance reads it straight off this row (see WriteRealizationHeadCountAsync), so a
        // corrected weight is in the balance the moment it is saved, with no entry to keep in step.
        if (existing.IsRealization)
        {
            existing.Quantity = production.Quantity;
        }
        else
        {
            existing.AnimalCount = production.AnimalCount;
            existing.ProductionTypeId = production.ProductionTypeId;
            existing.CollectionDate = production.CollectionDate;
            existing.Quantity = production.Quantity;
            existing.UnitId = production.UnitId;
        }
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

        // A realization taken back: the animal returns to the herd, and the entry that took it off
        // goes with the record that wrote it. Its meat leaves with the row itself — the balance
        // reads the collection, so there is nothing to put back on that side.
        if (existing.IsRealization)
        {
            await TakeBackRealizationHeadCountAsync(existing);
        }

        context.AnimalProductions.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
