using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockMovementRepository(AppDbContext context) : IStockMovementRepository
{
    public async Task<IEnumerable<StockMovement>> GetByStockAsync(int stockId)
    {
        return await context.StockMovements
            .AsNoTracking()
            .Where(m => m.StockId == stockId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<StockMovement> AddAsync(StockMovement movement)
    {
        context.StockMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> UpdateForHarvestItemAsync(int harvestItemId, int stockId, decimal delta)
    {
        var existing = await context.StockMovements.FirstOrDefaultAsync(m => m.HarvestItemId == harvestItemId);
        if (existing is null)
        {
            return false;
        }

        existing.StockId = stockId;
        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestItemAsync(int harvestItemId)
    {
        var existing = await context.StockMovements.FirstOrDefaultAsync(m => m.HarvestItemId == harvestItemId);
        if (existing is null)
        {
            return false;
        }

        context.StockMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateForHarvestResultAsync(int harvestResultId, int stockId, decimal delta)
    {
        var existing = await context.StockMovements.FirstOrDefaultAsync(m => m.HarvestResultId == harvestResultId);
        if (existing is null)
        {
            return false;
        }

        existing.StockId = stockId;
        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestResultAsync(int harvestResultId)
    {
        var existing = await context.StockMovements.FirstOrDefaultAsync(m => m.HarvestResultId == harvestResultId);
        if (existing is null)
        {
            return false;
        }

        context.StockMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
