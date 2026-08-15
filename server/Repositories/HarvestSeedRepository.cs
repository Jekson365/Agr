using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestSeedRepository(
    AppDbContext context,
    ISeedRepository seedRepository,
    ISeedMovementRepository seedMovementRepository) : IHarvestSeedRepository
{
    public async Task<IEnumerable<HarvestSeed>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestSeeds
            .AsNoTracking()
            .Where(s => s.HarvestId == harvestId)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<HarvestSeed> AddAsync(HarvestSeed harvestSeed)
    {
        context.HarvestSeeds.Add(harvestSeed);
        await context.SaveChangesAsync();

        // Sowing consumes the seed, so the movement is negative.
        await seedRepository.AdjustAmountRawAsync(harvestSeed.SeedId, -harvestSeed.Amount);
        await seedMovementRepository.AddAsync(new SeedMovement
        {
            SeedId = harvestSeed.SeedId,
            HarvestSeedId = harvestSeed.Id,
            Delta = -harvestSeed.Amount,
            Source = SeedMovementSource.Harvest,
        });

        return harvestSeed;
    }

    public async Task<bool> UpdateAsync(HarvestSeed harvestSeed)
    {
        var existing = await context.HarvestSeeds.FindAsync(harvestSeed.Id);
        if (existing is null)
        {
            return false;
        }

        var previousSeedId = existing.SeedId;
        var previousAmount = existing.Amount;

        existing.SeedId = harvestSeed.SeedId;
        existing.Amount = harvestSeed.Amount;
        await context.SaveChangesAsync();

        // Give the old amount back first — it may belong to a different seed than the new one.
        await seedRepository.AdjustAmountRawAsync(previousSeedId, previousAmount);
        await seedRepository.AdjustAmountRawAsync(harvestSeed.SeedId, -harvestSeed.Amount);

        // One movement per row, edited in place, so the history doesn't grow an entry per keystroke.
        var updated = await seedMovementRepository.UpdateForHarvestSeedAsync(
            harvestSeed.Id, harvestSeed.SeedId, -harvestSeed.Amount);
        if (!updated)
        {
            await seedMovementRepository.AddAsync(new SeedMovement
            {
                SeedId = harvestSeed.SeedId,
                HarvestSeedId = harvestSeed.Id,
                Delta = -harvestSeed.Amount,
                Source = SeedMovementSource.Harvest,
            });
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestSeeds.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        var seedId = existing.SeedId;
        var amount = existing.Amount;

        context.HarvestSeeds.Remove(existing);
        await context.SaveChangesAsync();

        await seedMovementRepository.DeleteForHarvestSeedAsync(id);
        await seedRepository.AdjustAmountRawAsync(seedId, amount);
        return true;
    }
}
