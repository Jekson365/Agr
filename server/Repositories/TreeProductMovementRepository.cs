using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeProductMovementRepository(AppDbContext context) : ITreeProductMovementRepository
{
    public async Task<IEnumerable<TreeProductMovement>> GetAsync(int? treeProductId = null)
    {
        var query = context.TreeProductMovements.AsNoTracking().AsQueryable();
        if (treeProductId is not null)
        {
            query = query.Where(m => m.TreeProductId == treeProductId);
        }
        return await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
    }

    public async Task<decimal> GetBalanceAsync(int treeProductId)
    {
        return await context.TreeProductMovements
            .Where(m => m.TreeProductId == treeProductId)
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;
    }

    public async Task<TreeProductMovement> AddAsync(TreeProductMovement movement)
    {
        context.TreeProductMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> UpdateForHarvestProductAsync(int harvestProductId, decimal delta)
    {
        var existing = await context.TreeProductMovements.FirstOrDefaultAsync(m => m.HarvestProductId == harvestProductId);
        if (existing is null)
        {
            return false;
        }

        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestProductAsync(int harvestProductId)
    {
        var existing = await context.TreeProductMovements.FirstOrDefaultAsync(m => m.HarvestProductId == harvestProductId);
        if (existing is null)
        {
            return false;
        }

        context.TreeProductMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
