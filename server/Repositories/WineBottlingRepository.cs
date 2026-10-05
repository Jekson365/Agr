using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class WineBottlingRepository(AppDbContext context) : IWineRecordRepository<WineBottling>
{
    public async Task<IEnumerable<WineBottling>> GetAsync(int? wineBatchId = null)
    {
        var query = context.WineBottlings.AsNoTracking().AsQueryable();
        if (wineBatchId is not null)
        {
            query = query.Where(b => b.WineBatchId == wineBatchId);
        }

        return await query.OrderByDescending(b => b.Date).ThenByDescending(b => b.Id).ToListAsync();
    }

    public async Task<WineBottling?> GetByIdAsync(int id)
    {
        return await context.WineBottlings.FindAsync(id);
    }

    public async Task<WineBottling> AddAsync(WineBottling record)
    {
        context.WineBottlings.Add(record);
        await context.SaveChangesAsync();
        return record;
    }

    public async Task UpdateAsync(WineBottling record)
    {
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(WineBottling record)
    {
        context.WineBottlings.Remove(record);
        await context.SaveChangesAsync();
    }
}
