using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseStockRepository(AppDbContext context) : IGreenhouseStockRepository
{
    public async Task<IEnumerable<GreenhouseStock>> GetAllAsync(int? greenhouseId = null)
    {
        var query = context.GreenhouseStocks.AsNoTracking().AsQueryable();
        if (greenhouseId is int id)
        {
            query = query.Where(s => s.GreenhouseId == id);
        }
        return await query.OrderBy(s => s.Id).ToListAsync();
    }

    public async Task<GreenhouseStock?> GetByIdAsync(int id)
    {
        return await context.GreenhouseStocks.FindAsync(id);
    }

    public async Task<GreenhouseStock> AddAsync(GreenhouseStock stock)
    {
        context.GreenhouseStocks.Add(stock);
        await context.SaveChangesAsync();
        return stock;
    }

    public async Task<bool> UpdateAsync(GreenhouseStock stock)
    {
        var existing = await context.GreenhouseStocks.FindAsync(stock.Id);
        if (existing is null)
        {
            return false;
        }

        existing.GreenhouseId = stock.GreenhouseId;
        existing.Type = stock.Type;
        existing.Name = stock.Name;
        existing.Amount = stock.Amount;
        existing.Unit = stock.Unit;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseStocks.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseStocks.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForGreenhouseAsync(int greenhouseId)
    {
        return await context.GreenhouseStocks.AnyAsync(s => s.GreenhouseId == greenhouseId);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
    {
        return await context.GreenhouseStocks
            .AnyAsync(s => s.Name.ToLower() == name.ToLower() && (excludeId == null || s.Id != excludeId));
    }

    public async Task AdjustAmountRawAsync(int stockId, decimal delta)
    {
        var existing = await context.GreenhouseStocks.FindAsync(stockId);
        if (existing is null)
        {
            return;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();
    }
}

public class GreenhouseSeedRepository(AppDbContext context) : IGreenhouseSeedRepository
{
    public async Task<IEnumerable<GreenhouseSeed>> GetAllAsync(int? greenhouseId = null)
    {
        var query = context.GreenhouseSeeds.AsNoTracking().AsQueryable();
        if (greenhouseId is int id)
        {
            query = query.Where(s => s.GreenhouseId == id);
        }
        return await query.OrderBy(s => s.Id).ToListAsync();
    }

    public async Task<GreenhouseSeed?> GetByIdAsync(int id)
    {
        return await context.GreenhouseSeeds.FindAsync(id);
    }

    public async Task<GreenhouseSeed> AddAsync(GreenhouseSeed seed)
    {
        context.GreenhouseSeeds.Add(seed);
        await context.SaveChangesAsync();
        return seed;
    }

    public async Task<bool> UpdateAsync(GreenhouseSeed seed)
    {
        var existing = await context.GreenhouseSeeds.FindAsync(seed.Id);
        if (existing is null)
        {
            return false;
        }

        existing.GreenhouseId = seed.GreenhouseId;
        existing.Type = seed.Type;
        existing.Name = seed.Name;
        existing.Amount = seed.Amount;
        existing.Unit = seed.Unit;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseSeeds.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseSeeds.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForGreenhouseAsync(int greenhouseId)
    {
        return await context.GreenhouseSeeds.AnyAsync(s => s.GreenhouseId == greenhouseId);
    }

    public async Task AdjustAmountRawAsync(int seedId, decimal delta)
    {
        var existing = await context.GreenhouseSeeds.FindAsync(seedId);
        if (existing is null)
        {
            return;
        }

        existing.Amount += delta;
        await context.SaveChangesAsync();
    }
}
