using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class WineMovementRepository(AppDbContext context) : IWineMovementRepository
{
    public async Task<IEnumerable<WineMovement>> GetAsync(int? wineBatchId = null)
    {
        var query = context.WineMovements.AsNoTracking().AsQueryable();
        if (wineBatchId is not null)
        {
            query = query.Where(m => m.WineBatchId == wineBatchId);
        }

        return await query.OrderByDescending(m => m.Date).ThenByDescending(m => m.Id).ToListAsync();
    }

    public async Task<WineMovement?> GetByIdAsync(int id)
    {
        return await context.WineMovements.FindAsync(id);
    }

    public async Task<(decimal Liters, int Bottles)> GetBalanceAsync(int wineBatchId, int? excludeId = null)
    {
        var rows = context.WineMovements.Where(m => m.WineBatchId == wineBatchId && (excludeId == null || m.Id != excludeId));
        var liters = await rows.SumAsync(m => (decimal?)m.Delta) ?? 0m;
        var bottles = await rows.SumAsync(m => (int?)m.BottleDelta) ?? 0;
        return (liters, bottles);
    }

    public async Task<int> GetBottlesLeftAsync(int wineBottlingId, int? excludeId = null)
    {
        return await context.WineMovements
            .Where(m => m.WineBottlingId == wineBottlingId && (excludeId == null || m.Id != excludeId))
            .SumAsync(m => (int?)m.BottleDelta) ?? 0;
    }

    public async Task<WineMovement?> GetProductionAsync(int wineBatchId)
    {
        return await context.WineMovements
            .FirstOrDefaultAsync(m => m.WineBatchId == wineBatchId && m.Source == WineMovementSource.Production);
    }

    public async Task<bool> HasOnlyProductionAsync(int wineBatchId)
    {
        return !await context.WineMovements
            .AnyAsync(m => m.WineBatchId == wineBatchId && m.Source != WineMovementSource.Production);
    }

    public async Task<WineMovement> AddAsync(WineMovement movement)
    {
        context.WineMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task UpdateAsync(WineMovement movement)
    {
        context.WineMovements.Update(movement);
        await context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.WineMovements.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.WineMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
