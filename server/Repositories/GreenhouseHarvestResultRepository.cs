using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseHarvestResultRepository(AppDbContext context, IGreenhouseStockRepository greenhouseStockRepository)
    : IGreenhouseHarvestResultRepository
{
    public async Task<IEnumerable<GreenhouseHarvestResult>> GetByHarvestAsync(int greenhouseHarvestId)
    {
        return await context.GreenhouseHarvestResults
            .AsNoTracking()
            .Where(r => r.GreenhouseHarvestId == greenhouseHarvestId)
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<GreenhouseHarvestResult?> GetByIdAsync(int id)
    {
        return await context.GreenhouseHarvestResults.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<bool> ExistsForHarvestAsync(int greenhouseHarvestId, int greenhouseStockId, int? excludeId = null)
    {
        return await context.GreenhouseHarvestResults
            .AnyAsync(r => r.GreenhouseHarvestId == greenhouseHarvestId
                && r.GreenhouseStockId == greenhouseStockId
                && (excludeId == null || r.Id != excludeId));
    }

    public async Task<GreenhouseHarvestResult> AddAsync(GreenhouseHarvestResult result)
    {
        context.GreenhouseHarvestResults.Add(result);
        await context.SaveChangesAsync();

        // Creation is only allowed while the harvest is Harvested (enforced by the controller),
        // so this always contributes to stock.
        await greenhouseStockRepository.AdjustAmountRawAsync(result.GreenhouseStockId, result.Amount);

        return result;
    }

    public async Task<bool> UpdateAsync(GreenhouseHarvestResult result)
    {
        var existing = await context.GreenhouseHarvestResults.FindAsync(result.Id);
        if (existing is null)
        {
            return false;
        }

        var previousStockId = existing.GreenhouseStockId;
        var previousAmount = existing.Amount;

        existing.GreenhouseStockId = result.GreenhouseStockId;
        existing.Amount = result.Amount;
        // GreenhouseHarvestId is fixed once created.

        await context.SaveChangesAsync();

        // Editing is only allowed while the harvest is Harvested, so the previous contribution is
        // always currently applied — undo it (it may belong to a different good) and apply the new.
        await greenhouseStockRepository.AdjustAmountRawAsync(previousStockId, -previousAmount);
        await greenhouseStockRepository.AdjustAmountRawAsync(result.GreenhouseStockId, result.Amount);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseHarvestResults.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Unlike add/update, delete isn't gated to the Harvested status — a result can outlive
        // the harvest being reverted off Harvested, at which point its contribution was already
        // reversed. Only reverse it here if it's still currently applied.
        var harvest = await context.GreenhouseHarvests.AsNoTracking().FirstOrDefaultAsync(h => h.Id == existing.GreenhouseHarvestId);
        var isApplied = harvest?.Status == HarvestStatus.Harvested;

        var stockId = existing.GreenhouseStockId;
        var amount = existing.Amount;

        context.GreenhouseHarvestResults.Remove(existing);
        await context.SaveChangesAsync();

        if (isApplied)
        {
            await greenhouseStockRepository.AdjustAmountRawAsync(stockId, -amount);
        }
        return true;
    }
}
