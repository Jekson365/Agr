using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class SeedMovementRepository(AppDbContext context) : ISeedMovementRepository
{
    public async Task<IEnumerable<SeedMovement>> GetBySeedAsync(int seedId)
    {
        return await context.SeedMovements
            .AsNoTracking()
            .Where(m => m.SeedId == seedId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<SeedMovement> AddAsync(SeedMovement movement)
    {
        context.SeedMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> UpdateForHarvestSeedAsync(int harvestSeedId, int seedId, decimal delta)
    {
        var existing = await context.SeedMovements.FirstOrDefaultAsync(m => m.HarvestSeedId == harvestSeedId);
        if (existing is null)
        {
            return false;
        }

        existing.SeedId = seedId;
        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestSeedAsync(int harvestSeedId)
    {
        var existing = await context.SeedMovements.FirstOrDefaultAsync(m => m.HarvestSeedId == harvestSeedId);
        if (existing is null)
        {
            return false;
        }

        context.SeedMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
