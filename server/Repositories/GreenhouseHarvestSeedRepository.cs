using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseHarvestSeedRepository(AppDbContext context, IGreenhouseSeedRepository greenhouseSeedRepository)
    : IGreenhouseHarvestSeedRepository
{
    public async Task<IEnumerable<GreenhouseHarvestSeed>> GetByHarvestAsync(int greenhouseHarvestId)
    {
        return await context.GreenhouseHarvestSeeds
            .AsNoTracking()
            .Where(s => s.GreenhouseHarvestId == greenhouseHarvestId)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<bool> ExistsForSeedAsync(int greenhouseSeedId)
    {
        return await context.GreenhouseHarvestSeeds.AnyAsync(s => s.GreenhouseSeedId == greenhouseSeedId);
    }

    public async Task<GreenhouseHarvestSeed> AddAsync(GreenhouseHarvestSeed harvestSeed)
    {
        context.GreenhouseHarvestSeeds.Add(harvestSeed);
        await context.SaveChangesAsync();

        // Sowing consumes the seed.
        await greenhouseSeedRepository.AdjustAmountRawAsync(harvestSeed.GreenhouseSeedId, -harvestSeed.Amount);

        return harvestSeed;
    }

    public async Task<bool> UpdateAsync(GreenhouseHarvestSeed harvestSeed)
    {
        var existing = await context.GreenhouseHarvestSeeds.FindAsync(harvestSeed.Id);
        if (existing is null)
        {
            return false;
        }

        var previousSeedId = existing.GreenhouseSeedId;
        var previousAmount = existing.Amount;

        existing.GreenhouseSeedId = harvestSeed.GreenhouseSeedId;
        existing.Amount = harvestSeed.Amount;
        await context.SaveChangesAsync();

        // Give the old amount back first — it may belong to a different seed than the new one.
        await greenhouseSeedRepository.AdjustAmountRawAsync(previousSeedId, previousAmount);
        await greenhouseSeedRepository.AdjustAmountRawAsync(harvestSeed.GreenhouseSeedId, -harvestSeed.Amount);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseHarvestSeeds.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        var seedId = existing.GreenhouseSeedId;
        var amount = existing.Amount;

        context.GreenhouseHarvestSeeds.Remove(existing);
        await context.SaveChangesAsync();

        await greenhouseSeedRepository.AdjustAmountRawAsync(seedId, amount);
        return true;
    }
}
