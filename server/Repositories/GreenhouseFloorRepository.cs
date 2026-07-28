using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseFloorRepository(AppDbContext context) : IGreenhouseFloorRepository
{
    public async Task<IEnumerable<GreenhouseFloor>> GetByGreenhouseAsync(int greenhouseId)
    {
        return await context.GreenhouseFloors.AsNoTracking()
            .Where(f => f.GreenhouseId == greenhouseId)
            .OrderBy(f => f.SortOrder)
            .ThenBy(f => f.Id)
            .ToListAsync();
    }

    public async Task<GreenhouseFloor?> GetByIdAsync(int id)
    {
        return await context.GreenhouseFloors.FindAsync(id);
    }

    public async Task<GreenhouseFloor> AddAsync(GreenhouseFloor floor)
    {
        // Appended after whatever this greenhouse already has, so a new floor always lands last
        // in the switcher rather than at an arbitrary position.
        var maxOrder = await context.GreenhouseFloors
            .Where(f => f.GreenhouseId == floor.GreenhouseId)
            .Select(f => (int?)f.SortOrder)
            .MaxAsync() ?? -1;
        floor.SortOrder = maxOrder + 1;

        context.GreenhouseFloors.Add(floor);
        await context.SaveChangesAsync();
        return floor;
    }

    public async Task<bool> UpdateAsync(GreenhouseFloor floor)
    {
        var existing = await context.GreenhouseFloors.FindAsync(floor.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = floor.Name;
        // GreenhouseId and SortOrder are fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseFloors.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseFloors.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}

public class GreenhouseSectionRepository(AppDbContext context) : IGreenhouseSectionRepository
{
    public async Task<IEnumerable<GreenhouseSection>> GetByFloorAsync(int greenhouseFloorId)
    {
        return await context.GreenhouseSections.AsNoTracking()
            .Where(s => s.GreenhouseFloorId == greenhouseFloorId)
            .OrderBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<GreenhouseSection?> GetByIdAsync(int id)
    {
        return await context.GreenhouseSections.FindAsync(id);
    }

    public async Task<GreenhouseSection> AddAsync(GreenhouseSection section)
    {
        context.GreenhouseSections.Add(section);
        await context.SaveChangesAsync();
        return section;
    }

    public async Task<bool> UpdateAsync(GreenhouseSection section)
    {
        var existing = await context.GreenhouseSections.FindAsync(section.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = section.Name;
        existing.X = section.X;
        existing.Y = section.Y;
        existing.Width = section.Width;
        existing.Height = section.Height;
        existing.Rotation = section.Rotation;
        // GreenhouseFloorId is fixed once created — moving a section to another floor isn't
        // supported; delete and re-add on the target floor instead.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseSections.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseSections.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}

public class GreenhouseSectionStockRepository(AppDbContext context) : IGreenhouseSectionStockRepository
{
    public async Task<IEnumerable<GreenhouseSectionStock>> GetByFloorAsync(int greenhouseFloorId)
    {
        return await (
            from ss in context.GreenhouseSectionStocks.AsNoTracking()
            join section in context.GreenhouseSections.AsNoTracking() on ss.GreenhouseSectionId equals section.Id
            where section.GreenhouseFloorId == greenhouseFloorId
            select ss
        ).ToListAsync();
    }

    public async Task SetStockIdsAsync(int greenhouseSectionId, IEnumerable<int> stockIds)
    {
        var existing = context.GreenhouseSectionStocks.Where(s => s.GreenhouseSectionId == greenhouseSectionId);
        context.GreenhouseSectionStocks.RemoveRange(existing);

        // A full replace rather than a diff — the join carries no data of its own worth
        // preserving per row, so re-creating the set on every save is simplest.
        foreach (var stockId in stockIds.Distinct())
        {
            context.GreenhouseSectionStocks.Add(new GreenhouseSectionStock
            {
                GreenhouseSectionId = greenhouseSectionId,
                GreenhouseStockId = stockId,
            });
        }

        await context.SaveChangesAsync();
    }
}
