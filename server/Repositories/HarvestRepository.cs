using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestRepository(
    AppDbContext context,
    IStockRepository stockRepository,
    IStockMovementRepository stockMovementRepository,
    ITreeStockRepository treeStockRepository,
    ITreeStockMovementRepository treeStockMovementRepository,
    ISeedRepository seedRepository) : IHarvestRepository
{
    public async Task<IEnumerable<Harvest>> GetAllAsync(HarvestKind? kind = null)
    {
        var query = context.Harvests.AsNoTracking().AsQueryable();
        if (kind is not null)
        {
            query = query.Where(h => h.Kind == kind);
        }
        return await query.OrderByDescending(h => h.Date).ToListAsync();
    }

    public async Task<Harvest?> GetByIdAsync(int id)
    {
        return await context.Harvests.FindAsync(id);
    }

    public async Task<Harvest> AddAsync(Harvest harvest)
    {
        context.Harvests.Add(harvest);
        await context.SaveChangesAsync();
        return harvest;
    }

    public async Task<bool> UpdateAsync(Harvest harvest)
    {
        var existing = await context.Harvests.FindAsync(harvest.Id);
        if (existing is null)
        {
            return false;
        }

        var previousStatus = existing.Status;

        existing.Title = harvest.Title;
        existing.Date = harvest.Date;
        existing.Status = harvest.Status;
        existing.ExpectedHarvestDate = harvest.ExpectedHarvestDate;
        existing.FarmId = harvest.FarmId;
        existing.LandPlotId = harvest.LandPlotId;
        existing.EquipmentCost = harvest.EquipmentCost;
        existing.WorkersCost = harvest.WorkersCost;
        existing.FuelCost = harvest.FuelCost;
        existing.OtherCost = harvest.OtherCost;
        existing.Revenue = harvest.Revenue;

        await context.SaveChangesAsync();

        // Stock is only ever adjusted for a harvest's recorded results once, at the moment it
        // becomes Harvested; moving off Harvested again reverses that same contribution.
        if (previousStatus != HarvestStatus.Harvested && harvest.Status == HarvestStatus.Harvested)
        {
            await ApplyStockAsync(harvest.Id);
        }
        else if (previousStatus == HarvestStatus.Harvested && harvest.Status != HarvestStatus.Harvested)
        {
            await ReverseStockAsync(harvest.Id);
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Harvests.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Deleting the harvest cascades away its results, seed usage and the movement rows that
        // explain them — but not the balances those movements moved. Undo them first, or the
        // stock keeps yield it never had and the seed stays down by an amount nothing records.
        if (existing.Status == HarvestStatus.Harvested)
        {
            await ReverseStockAsync(id);
        }
        await ReturnSeedsAsync(id);

        context.Harvests.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    /// <summary>Gives back the seed this harvest recorded as sown.</summary>
    private async Task ReturnSeedsAsync(int harvestId)
    {
        var usage = await context.HarvestSeeds.AsNoTracking().Where(s => s.HarvestId == harvestId).ToListAsync();
        foreach (var row in usage)
        {
            await seedRepository.AdjustAmountRawAsync(row.SeedId, row.Amount);
        }
    }

    private async Task ApplyStockAsync(int harvestId)
    {
        var results = await context.HarvestResults.AsNoTracking().Where(r => r.HarvestId == harvestId).ToListAsync();
        foreach (var result in results)
        {
            if (result.StockId is int stockId)
            {
                await stockRepository.AdjustAmountRawAsync(stockId, result.Amount);
                await stockMovementRepository.AddAsync(new StockMovement
                {
                    StockId = stockId,
                    HarvestResultId = result.Id,
                    Delta = result.Amount,
                    Source = StockMovementSource.Harvest,
                });
            }
            else if (result.TreeStockId is int treeStockId)
            {
                await treeStockRepository.AdjustAmountRawAsync(treeStockId, result.Amount);
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

    private async Task ReverseStockAsync(int harvestId)
    {
        var results = await context.HarvestResults.AsNoTracking().Where(r => r.HarvestId == harvestId).ToListAsync();
        foreach (var result in results)
        {
            if (result.StockId is int stockId)
            {
                await stockRepository.AdjustAmountRawAsync(stockId, -result.Amount);
                await stockMovementRepository.DeleteForHarvestResultAsync(result.Id);
            }
            else if (result.TreeStockId is int treeStockId)
            {
                await treeStockRepository.AdjustAmountRawAsync(treeStockId, -result.Amount);
                await treeStockMovementRepository.DeleteForHarvestResultAsync(result.Id);
            }
        }
    }
}
