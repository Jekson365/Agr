using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class SeedRepository(AppDbContext context, ISeedMovementRepository seedMovementRepository) : ISeedRepository
{
    public async Task<IEnumerable<Seed>> GetAllAsync(bool includeDeleted = false)
    {
        return await context.Seeds
            .AsNoTracking()
            .Where(s => includeDeleted || !s.IsDeleted)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<Seed?> GetByIdAsync(int id)
    {
        return await context.Seeds.FindAsync(id);
    }

    public async Task<Seed> AddAsync(Seed seed)
    {
        context.Seeds.Add(seed);
        await context.SaveChangesAsync();

        // The opening amount is the first entry in the seed's history, so the log always
        // explains the balance on its own — same as Stock.
        if (seed.Amount != 0)
        {
            await LogMovementAsync(seed.Id, seed.Amount, SeedMovementSource.Manual);
        }

        return seed;
    }

    public async Task<int> SoftDeleteByCropAsync(string type, string name)
    {
        var wantedType = type.Trim().ToLower();
        var wantedName = name.Trim().ToLower();

        var seeds = await context.Seeds
            .Where(s => !s.IsDeleted
                && s.Type.Trim().ToLower() == wantedType
                && s.Name.Trim().ToLower() == wantedName)
            .ToListAsync();

        foreach (var seed in seeds)
        {
            seed.IsDeleted = true;
        }

        await context.SaveChangesAsync();
        return seeds.Count;
    }

    public async Task AdjustAmountRawAsync(int seedId, decimal delta)
    {
        var existing = await context.Seeds.FindAsync(seedId);
        if (existing is null)
        {
            return;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();
    }

    private Task LogMovementAsync(int seedId, decimal delta, SeedMovementSource source)
    {
        return seedMovementRepository.AddAsync(new SeedMovement { SeedId = seedId, Delta = delta, Source = source });
    }
}
