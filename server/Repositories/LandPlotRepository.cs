using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LandPlotRepository(AppDbContext context) : ILandPlotRepository
{
    public async Task<IEnumerable<LandPlot>> GetByFarmAsync(int farmId)
    {
        return await context.LandPlots
            .AsNoTracking()
            .Where(p => p.FarmId == farmId)
            .OrderBy(p => p.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<LandPlot>> GetAllAsync()
    {
        return await context.LandPlots
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .ToListAsync();
    }

    public async Task<LandPlot?> GetByIdAsync(int id)
    {
        return await context.LandPlots.FindAsync(id);
    }

    public async Task<bool> ExistsByTreeStockAsync(int farmId, int treeStockId, int? excludeId = null)
    {
        return await context.LandPlots
            .AnyAsync(p => p.FarmId == farmId
                && p.TreeStockId == treeStockId
                && (excludeId == null || p.Id != excludeId));
    }

    public async Task<IEnumerable<int>> GetUsedTreeStockIdsAsync(int? farmId = null)
    {
        return await context.LandPlots
            .Where(p => p.TreeStockId != null && (farmId == null || p.FarmId == farmId))
            .Select(p => p.TreeStockId!.Value)
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> DeleteByTreeStockAsync(int treeStockId)
    {
        var plots = await context.LandPlots
            .Where(p => p.TreeStockId == treeStockId)
            .ToListAsync();

        if (plots.Count == 0)
        {
            return 0;
        }

        context.LandPlots.RemoveRange(plots);
        await context.SaveChangesAsync();
        return plots.Count;
    }

    public async Task<bool> ExistsByStockAsync(int farmId, int stockId, int? excludeId = null)
    {
        return await context.LandPlots
            .AnyAsync(p => p.FarmId == farmId
                && p.StockId == stockId
                && (excludeId == null || p.Id != excludeId));
    }

    public async Task<IEnumerable<int>> GetUsedStockIdsAsync(int? farmId = null)
    {
        return await context.LandPlots
            .Where(p => p.StockId != null && (farmId == null || p.FarmId == farmId))
            .Select(p => p.StockId!.Value)
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> DeleteByStockAsync(int stockId)
    {
        var plots = await context.LandPlots
            .Where(p => p.StockId == stockId)
            .ToListAsync();

        if (plots.Count == 0)
        {
            return 0;
        }

        context.LandPlots.RemoveRange(plots);
        await context.SaveChangesAsync();
        return plots.Count;
    }

    public async Task<LandPlot> AddAsync(LandPlot plot)
    {
        context.LandPlots.Add(plot);
        await context.SaveChangesAsync();
        return plot;
    }

    public async Task<bool> UpdateAsync(LandPlot plot)
    {
        var existing = await context.LandPlots.FindAsync(plot.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Area = plot.Area;
        existing.Crop = plot.Crop;
        existing.TreeStockId = plot.TreeStockId;
        existing.StockId = plot.StockId;
        // FarmId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.LandPlots.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.LandPlots.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
