using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class WineBatchGrapeRepository(AppDbContext context) : IWineBatchGrapeRepository
{
    public async Task<IEnumerable<WineBatchGrape>> GetAsync(int? wineBatchId = null)
    {
        var query = context.WineBatchGrapes.AsNoTracking().AsQueryable();
        if (wineBatchId is not null)
        {
            query = query.Where(g => g.WineBatchId == wineBatchId);
        }

        return await query.OrderBy(g => g.Id).ToListAsync();
    }

    public async Task<WineBatchGrape?> GetByIdAsync(int id)
    {
        return await context.WineBatchGrapes.FindAsync(id);
    }

    public async Task<bool> ExistsForBatchAsync(int wineBatchId, int treeProductId, int? excludeId = null)
    {
        return await context.WineBatchGrapes.AnyAsync(g =>
            g.WineBatchId == wineBatchId && g.TreeProductId == treeProductId && (excludeId == null || g.Id != excludeId));
    }

    public async Task<TreeProductCategory?> GetProductCategoryAsync(int treeProductId)
    {
        return await context.TreeProducts
            .Where(p => p.Id == treeProductId)
            .Select(p => (TreeProductCategory?)p.Category)
            .FirstOrDefaultAsync();
    }

    public async Task<decimal> GetAvailableAsync(int treeProductId, int? excludeGrapeId = null)
    {
        return await context.TreeProductMovements
            .Where(m => m.TreeProductId == treeProductId
                && (excludeGrapeId == null || m.WineBatchGrapeId == null || m.WineBatchGrapeId != excludeGrapeId))
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;
    }

    public async Task<WineBatchGrape> AddAsync(WineBatchGrape grape, DateOnly date)
    {
        context.WineBatchGrapes.Add(grape);
        await context.SaveChangesAsync();

        context.TreeProductMovements.Add(new TreeProductMovement
        {
            TreeProductId = grape.TreeProductId,
            WineBatchGrapeId = grape.Id,
            Delta = -grape.Amount,
            Source = TreeProductMovementSource.Winemaking,
            Date = date,
        });
        await context.SaveChangesAsync();
        return grape;
    }

    public async Task<bool> UpdateAsync(WineBatchGrape grape)
    {
        var existing = await context.WineBatchGrapes.FindAsync(grape.Id);
        if (existing is null)
        {
            return false;
        }

        existing.TreeProductId = grape.TreeProductId;
        existing.Amount = grape.Amount;

        var movement = await context.TreeProductMovements.FirstOrDefaultAsync(m => m.WineBatchGrapeId == grape.Id);
        if (movement is null)
        {
            context.TreeProductMovements.Add(new TreeProductMovement
            {
                TreeProductId = grape.TreeProductId,
                WineBatchGrapeId = grape.Id,
                Delta = -grape.Amount,
                Source = TreeProductMovementSource.Winemaking,
            });
        }
        else
        {
            movement.TreeProductId = grape.TreeProductId;
            movement.Delta = -grape.Amount;
        }

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.WineBatchGrapes.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.WineBatchGrapes.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
