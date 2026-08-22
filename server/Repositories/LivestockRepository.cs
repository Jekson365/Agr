using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockRepository(AppDbContext context) : ILivestockRepository
{
    public async Task<IEnumerable<Livestock>> GetAllAsync(bool includeDeleted = false)
    {
        var groups = await context.Livestock
            .AsNoTracking()
            .Where(l => includeDeleted || !l.IsDeleted)
            .ToListAsync();

        var ids = groups.Select(l => l.Id).ToList();
        var produces = await context.LivestockProduces
            .AsNoTracking()
            .Where(p => ids.Contains(p.LivestockId))
            .ToListAsync();

        foreach (var group in groups)
        {
            group.ProductionTypeIds = [.. produces.Where(p => p.LivestockId == group.Id).Select(p => p.ProductionTypeId)];
        }

        return groups;
    }

    public async Task<Livestock?> GetByIdAsync(int id)
    {
        var group = await context.Livestock.FindAsync(id);
        if (group is not null)
        {
            group.ProductionTypeIds = await GetProduceIdsAsync(id);
        }

        return group;
    }

    public async Task<List<int>> GetProduceIdsAsync(int livestockId)
    {
        return await context.LivestockProduces
            .AsNoTracking()
            .Where(p => p.LivestockId == livestockId)
            .Select(p => p.ProductionTypeId)
            .ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
    {
        // A removed group appears in no list, so there is nothing left for a name to tell apart.
        return await context.Livestock
            .AnyAsync(l => !l.IsDeleted && l.Name.ToLower() == name.ToLower() && (excludeId == null || l.Id != excludeId));
    }

    public async Task<Livestock> AddAsync(Livestock livestock)
    {
        var declared = livestock.DeclaredProduceIds() ?? [];
        livestock.ProductionTypeId = declared.Count > 0 ? declared[0] : null;

        context.Livestock.Add(livestock);
        await context.SaveChangesAsync();

        if (declared.Count > 0)
        {
            context.LivestockProduces.AddRange(
                declared.Select(typeId => new LivestockProduce { LivestockId = livestock.Id, ProductionTypeId = typeId }));
            await context.SaveChangesAsync();
        }

        livestock.ProductionTypeIds = declared;
        return livestock;
    }

    public async Task<bool> UpdateAsync(Livestock livestock)
    {
        var existing = await context.Livestock.FindAsync(livestock.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Type = livestock.Type;
        existing.FarmId = livestock.FarmId;
        // Name is deliberately not copied, for the same reason as Count below. The group is
        // referred to by name throughout production, the balances and the reports, and its own
        // meat type carries the name it was created with — a rename would leave all of that
        // naming something that no longer exists.
        // Count is deliberately not copied. It is settled when the group is created and moves
        // only with the things that keep the movement ledger — animals added to or taken off the
        // group — so a figure arriving on an edit would put the herd out of step with the entries
        // that account for it. Ignored rather than refused: callers legitimately PUT the whole
        // group to change something else — linking its meat, renaming it — and carry the count
        // along without meaning anything by it.
        var declared = livestock.DeclaredProduceIds();
        if (declared is not null)
        {
            var current = await context.LivestockProduces
                .Where(p => p.LivestockId == livestock.Id)
                .ToListAsync();

            context.LivestockProduces.RemoveRange(current.Where(p => !declared.Contains(p.ProductionTypeId)));
            context.LivestockProduces.AddRange(declared
                .Where(typeId => current.All(p => p.ProductionTypeId != typeId))
                .Select(typeId => new LivestockProduce { LivestockId = livestock.Id, ProductionTypeId = typeId }));

            existing.ProductionTypeId = declared.Count > 0 ? declared[0] : null;
        }
        // Only ever set: the group's meat is created with the group, or on its first realization
        // for one that predates it. A payload that omits it — an older client, or the mobile app
        // before it knows the field — must not unlink what a realization is already filed under.
        existing.MeatProductionTypeId = livestock.MeatProductionTypeId ?? existing.MeatProductionTypeId;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AdjustCountAsync(int livestockId, int delta)
    {
        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == livestockId);
        if (group is null)
        {
            return false;
        }

        // Clamped for the same reason realization's is: a herd stuck at zero is recoverable, a
        // negative one is not.
        group.Count = Math.Max(0, group.Count + delta);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var existing = await context.Livestock.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        existing.IsDeleted = true;
        await context.SaveChangesAsync();
        return true;
    }
}
