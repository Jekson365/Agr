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
        item.Unit = await ResolveUnitAsync(item);
        context.HarvestItems.Add(item);
        await context.SaveChangesAsync();
        return item;
    }

    /// <summary>
    /// The unit to store: what the caller asked for, or the target good's own unit when it sent
    /// none. Older clients don't know about the field, and a blank unit would render as a bare
    /// number next to the planned amount.
    /// </summary>
    private async Task<string> ResolveUnitAsync(HarvestItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.Unit))
        {
            return item.Unit.Trim();
        }

        if (item.StockId is int stockId)
        {
            var stock = await context.Stocks.AsNoTracking().FirstOrDefaultAsync(s => s.Id == stockId);
            return stock is null ? string.Empty : stock.Unit.ToString();
        }

        if (item.TreeStockId is int treeStockId)
        {
            var treeStock = await context.TreeStocks.AsNoTracking().FirstOrDefaultAsync(s => s.Id == treeStockId);
            return treeStock is null ? string.Empty : treeStock.Unit.ToString();
        }

        return string.Empty;
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
        existing.Unit = await ResolveUnitAsync(item);
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
