using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockFeedRepository(AppDbContext context) : IStockFeedRepository
{
    public async Task<IEnumerable<StockFeed>> GetByLivestockAsync(int livestockId)
    {
        return await context.StockFeeds
            .AsNoTracking()
            .Where(f => f.LivestockId == livestockId)
            .OrderBy(f => f.Id)
            .ToListAsync();
    }

    public async Task<StockFeed> AddAsync(StockFeed feed)
    {
        context.StockFeeds.Add(feed);
        await context.SaveChangesAsync();
        return feed;
    }

    public async Task<bool> UpdateAsync(StockFeed feed)
    {
        var existing = await context.StockFeeds.FindAsync(feed.Id);
        if (existing is null)
        {
            return false;
        }

        existing.StockId = feed.StockId;
        existing.Amount = feed.Amount;
        // LivestockId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.StockFeeds.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.StockFeeds.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
