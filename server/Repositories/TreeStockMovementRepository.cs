using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeStockMovementRepository(AppDbContext context) : ITreeStockMovementRepository
{
    public async Task<IEnumerable<TreeStockMovement>> GetByTreeStockAsync(int treeStockId)
    {
        return await context.TreeStockMovements
            .AsNoTracking()
            .Where(m => m.TreeStockId == treeStockId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<TreeStockMovement> AddAsync(TreeStockMovement movement)
    {
        context.TreeStockMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> UpdateForHarvestItemAsync(int harvestItemId, int treeStockId, decimal delta)
    {
        var existing = await context.TreeStockMovements.FirstOrDefaultAsync(m => m.HarvestItemId == harvestItemId);
        if (existing is null)
        {
            return false;
        }

        existing.TreeStockId = treeStockId;
        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestItemAsync(int harvestItemId)
    {
        var existing = await context.TreeStockMovements.FirstOrDefaultAsync(m => m.HarvestItemId == harvestItemId);
        if (existing is null)
        {
            return false;
        }

        context.TreeStockMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateForHarvestResultAsync(int harvestResultId, int treeStockId, decimal delta)
    {
        var existing = await context.TreeStockMovements.FirstOrDefaultAsync(m => m.HarvestResultId == harvestResultId);
        if (existing is null)
        {
            return false;
        }

        existing.TreeStockId = treeStockId;
        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestResultAsync(int harvestResultId)
    {
        var existing = await context.TreeStockMovements.FirstOrDefaultAsync(m => m.HarvestResultId == harvestResultId);
        if (existing is null)
        {
            return false;
        }

        context.TreeStockMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
