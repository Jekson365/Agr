using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class SeedRepository(AppDbContext context, ISeedMovementRepository seedMovementRepository) : ISeedRepository
{
    public async Task<IEnumerable<Seed>> GetAllAsync()
    {
        return await context.Seeds.AsNoTracking().OrderBy(s => s.Id).ToListAsync();
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

    public async Task<bool> UpdateAsync(Seed seed)
    {
        var existing = await context.Seeds.FindAsync(seed.Id);
        if (existing is null)
        {
            return false;
        }

        var delta = seed.Amount - existing.Amount;

        existing.Type = seed.Type;
        existing.Name = seed.Name;
        existing.Amount = seed.Amount;
        existing.Unit = seed.Unit;

        await context.SaveChangesAsync();

        if (delta != 0)
        {
            await LogMovementAsync(seed.Id, delta, SeedMovementSource.Manual);
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Seeds.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.Seeds.Remove(existing);
        await context.SaveChangesAsync();
        return true;
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
