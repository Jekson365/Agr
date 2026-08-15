using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockRepository(AppDbContext context) : ILivestockRepository
{
    public async Task<IEnumerable<Livestock>> GetAllAsync(bool includeDeleted = false)
    {
        return await context.Livestock
            .AsNoTracking()
            .Where(l => includeDeleted || !l.IsDeleted)
            .ToListAsync();
    }

    public async Task<Livestock?> GetByIdAsync(int id)
    {
        return await context.Livestock.FindAsync(id);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
    {
        // A removed group appears in no list, so there is nothing left for a name to tell apart.
        return await context.Livestock
            .AnyAsync(l => !l.IsDeleted && l.Name.ToLower() == name.ToLower() && (excludeId == null || l.Id != excludeId));
    }

    public async Task<Livestock> AddAsync(Livestock livestock)
    {
        context.Livestock.Add(livestock);
        await context.SaveChangesAsync();
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
        // Only ever the first declaration or the value it already has — the controller refuses
        // anything else, so what arrives here is what the group produces either way.
        existing.ProductionTypeId = livestock.ProductionTypeId;
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
