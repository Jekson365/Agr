using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockRepository(AppDbContext context, IStockMovementRepository stockMovementRepository) : IStockRepository
{
    public async Task<IEnumerable<Stock>> GetAllAsync(bool includeDeleted = false)
    {
        return await context.Stocks
            .AsNoTracking()
            .Where(s => includeDeleted || !s.IsDeleted)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<Stock?> GetByIdAsync(int id)
    {
        return await context.Stocks.FindAsync(id);
    }

    public async Task<Stock> AddAsync(Stock stock)
    {
        context.Stocks.Add(stock);
        await context.SaveChangesAsync();

        if (stock.Amount >= 0)
        {
            await LogMovementAsync(stock.Id, stock.Amount, StockMovementSource.Manual);
        }

        return stock;
    }

    public async Task<bool> UpdateAsync(Stock stock)
    {
        var existing = await context.Stocks.FindAsync(stock.Id);
        if (existing is null)
        {
            return false;
        }

        var delta = stock.Amount - existing.Amount;

        existing.Type = stock.Type;
        existing.Name = stock.Name;
        existing.Amount = stock.Amount;
        existing.Unit = stock.Unit;

        await context.SaveChangesAsync();

        if (delta != 0)
        {
            await LogMovementAsync(stock.Id, delta, StockMovementSource.Manual);
        }

        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var existing = await context.Stocks.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        existing.IsDeleted = true;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task AdjustAmountRawAsync(int stockId, decimal delta)
    {
        var existing = await context.Stocks.FindAsync(stockId);
        if (existing is null)
        {
            return;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();
    }

    public async Task<Stock?> AdjustAmountAsync(int stockId, decimal delta, StockMovementSource source, int? marketListingId = null)
    {
        var existing = await context.Stocks.FindAsync(stockId);
        if (existing is null)
        {
            return null;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();

        if (delta != 0)
        {
            await LogMovementAsync(stockId, delta, source, marketListingId);
        }

        return existing;
    }

    private Task LogMovementAsync(int stockId, decimal delta, StockMovementSource source, int? marketListingId = null)
    {
        return stockMovementRepository.AddAsync(
            new StockMovement { StockId = stockId, Delta = delta, Source = source, MarketListingId = marketListingId });
    }
}
