using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockHistoryRepository(AppDbContext context) : IStockHistoryRepository
{
    public async Task<IEnumerable<StockHistory>> GetByStockAsync(int stockId)
    {
        return await context.StockHistories
            .AsNoTracking()
            .Where(h => h.StockId == stockId)
            .OrderBy(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<StockHistory> AddAsync(StockHistory history)
    {
        context.StockHistories.Add(history);
        await context.SaveChangesAsync();
        return history;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.StockHistories.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.StockHistories.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
