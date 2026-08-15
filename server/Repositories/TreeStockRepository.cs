using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeStockRepository(AppDbContext context, ITreeStockMovementRepository treeStockMovementRepository) : ITreeStockRepository
{
    public async Task<IEnumerable<TreeStock>> GetAllAsync(bool includeDeleted = false)
    {
        return await context.TreeStocks
            .AsNoTracking()
            .Where(s => includeDeleted || !s.IsDeleted)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<TreeStock?> GetByIdAsync(int id)
    {
        return await context.TreeStocks.FindAsync(id);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
    {
        // A removed fruit appears in no list, so there is nothing left for a label to tell apart —
        // its own is free to use again.
        return await context.TreeStocks
            .AnyAsync(s => !s.IsDeleted && s.Name.ToLower() == name.ToLower() && (excludeId == null || s.Id != excludeId));
    }

    public async Task<bool> ExistsByTreeProductAsync(int treeProductId, int? excludeId = null)
    {
        // Removed rows count here, unlike the label above: a fruit keeps the product it yielded so
        // that product's harvest ledger still reads back through it, and the unique index on the
        // table counts them too — so a check that skipped them would pass writes the DB refuses.
        return await context.TreeStocks
            .AnyAsync(s => s.TreeProductId == treeProductId && (excludeId == null || s.Id != excludeId));
    }

    public async Task<TreeStock> AddAsync(TreeStock stock)
    {
        context.TreeStocks.Add(stock);
        await context.SaveChangesAsync();

        if (stock.Amount >= 0)
        {
            await LogMovementAsync(stock.Id, stock.Amount);
        }

        return stock;
    }

    public async Task<bool> UpdateAsync(TreeStock stock)
    {
        var existing = await context.TreeStocks.FindAsync(stock.Id);
        if (existing is null)
        {
            return false;
        }

        var delta = stock.Amount - existing.Amount;

        existing.Type = stock.Type;
        existing.Name = stock.Name;
        existing.Amount = stock.Amount;
        existing.Unit = stock.Unit;
        existing.LandPlotId = stock.LandPlotId;
        // The controller settles which product may be written here — that it isn't taken, and that
        // a harvest hasn't already fixed it — and fills a missing one back in from the stored row,
        // so an edit can only ever move the product, never clear it.
        existing.TreeProductId = stock.TreeProductId;

        await context.SaveChangesAsync();

        if (delta != 0)
        {
            await LogMovementAsync(stock.Id, delta);
        }

        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var existing = await context.TreeStocks.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        existing.IsDeleted = true;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task AdjustAmountRawAsync(int treeStockId, decimal delta)
    {
        var existing = await context.TreeStocks.FindAsync(treeStockId);
        if (existing is null)
        {
            return;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();
    }

    public async Task<TreeStock?> AdjustAmountAsync(int treeStockId, decimal delta, StockMovementSource source, int? marketListingId = null)
    {
        var existing = await context.TreeStocks.FindAsync(treeStockId);
        if (existing is null)
        {
            return null;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();

        if (delta != 0)
        {
            await LogMovementAsync(treeStockId, delta, source, marketListingId);
        }

        return existing;
    }

    private Task LogMovementAsync(
        int treeStockId,
        decimal delta,
        StockMovementSource source = StockMovementSource.Manual,
        int? marketListingId = null)
    {
        return treeStockMovementRepository.AddAsync(new TreeStockMovement
        {
            TreeStockId = treeStockId,
            Delta = delta,
            Source = source,
            MarketListingId = marketListingId,
        });
    }
}
