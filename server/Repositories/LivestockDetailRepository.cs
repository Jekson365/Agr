using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockDetailRepository(AppDbContext context) : ILivestockDetailRepository
{
    public async Task<IEnumerable<LivestockDetail>> GetByLivestockAsync(int livestockId)
    {
        return await context.LivestockDetails
            .AsNoTracking()
            .Where(d => d.LivestockId == livestockId)
            .OrderBy(d => d.Id)
            .ToListAsync();
    }

    public async Task<LivestockDetail?> GetByIdAsync(int id)
    {
        return await context.LivestockDetails.FindAsync(id);
    }

    public async Task<LivestockDetail> AddAsync(LivestockDetail detail)
    {
        context.LivestockDetails.Add(detail);
        await context.SaveChangesAsync();
        return detail;
    }

    public async Task<bool> UpdateAsync(LivestockDetail detail)
    {
        var existing = await context.LivestockDetails.FindAsync(detail.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Code = detail.Code;
        existing.ImagePath = detail.ImagePath;
        existing.BornDate = detail.BornDate;
        existing.Gender = detail.Gender;
        // LivestockId is fixed once created — a detail can't move between groups.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.LivestockDetails.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.LivestockDetails.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
