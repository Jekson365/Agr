using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseHarvestItemRepository(AppDbContext context) : IGreenhouseHarvestItemRepository
{
    public async Task<IEnumerable<GreenhouseHarvestItem>> GetByHarvestAsync(int greenhouseHarvestId)
    {
        return await context.GreenhouseHarvestItems
            .AsNoTracking()
            .Where(i => i.GreenhouseHarvestId == greenhouseHarvestId)
            .OrderBy(i => i.Id)
            .ToListAsync();
    }

    public async Task<GreenhouseHarvestItem> AddAsync(GreenhouseHarvestItem item)
    {
        item.Unit = await ResolveUnitAsync(item);
        context.GreenhouseHarvestItems.Add(item);
        await context.SaveChangesAsync();
        return item;
    }

    /// <summary>The unit to store: what the caller asked for, or the target's own unit when it
    /// sent none — a blank unit would render as a bare number next to the planned amount.</summary>
    private async Task<string> ResolveUnitAsync(GreenhouseHarvestItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.Unit))
        {
            return item.Unit.Trim();
        }

        var stock = await context.GreenhouseStocks.AsNoTracking().FirstOrDefaultAsync(s => s.Id == item.GreenhouseStockId);
        return stock is null ? string.Empty : stock.Unit.ToString();
    }

    public async Task<bool> UpdateAsync(GreenhouseHarvestItem item)
    {
        var existing = await context.GreenhouseHarvestItems.FindAsync(item.Id);
        if (existing is null)
        {
            return false;
        }

        existing.GreenhouseStockId = item.GreenhouseStockId;
        existing.Amount = item.Amount;
        existing.Unit = await ResolveUnitAsync(item);
        // GreenhouseHarvestId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseHarvestItems.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseHarvestItems.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
