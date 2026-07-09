using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestItemRepository(AppDbContext context) : IHarvestItemRepository
{
    public async Task<IEnumerable<HarvestItem>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestItems
            .AsNoTracking()
            .Where(i => i.HarvestId == harvestId)
            .OrderBy(i => i.Id)
            .ToListAsync();
    }

    public async Task<HarvestItem> AddAsync(HarvestItem item)
    {
        context.HarvestItems.Add(item);
        await context.SaveChangesAsync();
        return item;
    }

    public async Task<bool> UpdateAsync(HarvestItem item)
    {
        var existing = await context.HarvestItems.FindAsync(item.Id);
        if (existing is null)
        {
            return false;
        }

        existing.StockId = item.StockId;
        existing.TreeStockId = item.TreeStockId;
        existing.Amount = item.Amount;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestItems.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.HarvestItems.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
