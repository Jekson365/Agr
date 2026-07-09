using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestResultRepository(
    AppDbContext context,
    IStockRepository stockRepository,
    IStockMovementRepository stockMovementRepository,
    ITreeStockRepository treeStockRepository,
    ITreeStockMovementRepository treeStockMovementRepository) : IHarvestResultRepository
{
    public async Task<IEnumerable<HarvestResult>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestResults
            .AsNoTracking()
            .Where(r => r.HarvestId == harvestId)
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<HarvestResult> AddAsync(HarvestResult result)
    {
        context.HarvestResults.Add(result);
        await context.SaveChangesAsync();

        // Creation is only allowed while the harvest is Harvested (enforced by the controller),
        // so this always contributes to stock.
        await ApplyAsync(result);

        return result;
    }

    public async Task<bool> UpdateAsync(HarvestResult result)
    {
        var existing = await context.HarvestResults.FindAsync(result.Id);
        if (existing is null)
        {
            return false;
        }

        var previous = new HarvestResult
        {
            Id = existing.Id,
            HarvestId = existing.HarvestId,
            StockId = existing.StockId,
            TreeStockId = existing.TreeStockId,
            Amount = existing.Amount,
        };

        existing.StockId = result.StockId;
        existing.TreeStockId = result.TreeStockId;
        existing.Amount = result.Amount;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();

        // Editing is only allowed while the harvest is Harvested (enforced by the controller), so
        // the previous contribution is always currently applied — undo it and apply the new one.
        await ReverseRawAsync(previous);
        await ApplyAsync(result, updateExistingMovement: true);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestResults.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Unlike add/update, delete isn't gated to the Harvested status — a result can outlive
        // the harvest being reverted off Harvested, at which point its contribution was already
        // reversed. Only reverse it here if it's still currently applied.
        var harvest = await context.Harvests.AsNoTracking().FirstOrDefaultAsync(h => h.Id == existing.HarvestId);
        var isApplied = harvest?.Status == HarvestStatus.Harvested;

        var snapshot = new HarvestResult
        {
            Id = existing.Id,
            HarvestId = existing.HarvestId,
            StockId = existing.StockId,
            TreeStockId = existing.TreeStockId,
            Amount = existing.Amount,
        };

        context.HarvestResults.Remove(existing);
        await context.SaveChangesAsync();

        // The linked movement is removed via cascade delete (StockMovement/TreeStockMovement.HarvestResultId -> HarvestResults.Id).
        if (isApplied)
        {
            await ReverseRawAsync(snapshot);
        }
        return true;
    }

    private async Task ApplyAsync(HarvestResult result, bool updateExistingMovement = false)
    {
        if (result.StockId is int stockId)
        {
            await stockRepository.AdjustAmountRawAsync(stockId, result.Amount);

            var updated = updateExistingMovement
                && await stockMovementRepository.UpdateForHarvestResultAsync(result.Id, stockId, result.Amount);
            if (!updated)
            {
                await stockMovementRepository.AddAsync(new StockMovement
                {
                    StockId = stockId,
                    HarvestResultId = result.Id,
                    Delta = result.Amount,
                    Source = StockMovementSource.Harvest,
                });
            }
        }
        else if (result.TreeStockId is int treeStockId)
        {
            await treeStockRepository.AdjustAmountRawAsync(treeStockId, result.Amount);

            var updated = updateExistingMovement
                && await treeStockMovementRepository.UpdateForHarvestResultAsync(result.Id, treeStockId, result.Amount);
            if (!updated)
            {
                await treeStockMovementRepository.AddAsync(new TreeStockMovement
                {
                    TreeStockId = treeStockId,
                    HarvestResultId = result.Id,
                    Delta = result.Amount,
                    Source = StockMovementSource.Harvest,
                });
            }
        }
    }

    private async Task ReverseRawAsync(HarvestResult result)
    {
        if (result.StockId is int stockId)
        {
            await stockRepository.AdjustAmountRawAsync(stockId, -result.Amount);
        }
        else if (result.TreeStockId is int treeStockId)
        {
            await treeStockRepository.AdjustAmountRawAsync(treeStockId, -result.Amount);
        }
    }
}
