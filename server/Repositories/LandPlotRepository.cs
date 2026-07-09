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

    public async Task<LandPlot?> GetByIdAsync(int id)
    {
        return await context.LandPlots.FindAsync(id);
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
