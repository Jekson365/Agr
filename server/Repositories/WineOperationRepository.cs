using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class WineOperationRepository(AppDbContext context) : IWineRecordRepository<WineOperation>
{
    public async Task<IEnumerable<WineOperation>> GetAsync(int? wineBatchId = null)
    {
        var query = context.WineOperations.AsNoTracking().AsQueryable();
        if (wineBatchId is not null)
        {
            query = query.Where(o => o.WineBatchId == wineBatchId);
        }

        return await query.OrderByDescending(o => o.Date).ThenByDescending(o => o.Id).ToListAsync();
    }

    public async Task<WineOperation?> GetByIdAsync(int id)
    {
        return await context.WineOperations.FindAsync(id);
    }

    public async Task<WineOperation> AddAsync(WineOperation record)
    {
        context.WineOperations.Add(record);
        await context.SaveChangesAsync();
        return record;
    }

    public async Task UpdateAsync(WineOperation record)
    {
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(WineOperation record)
    {
        context.WineOperations.Remove(record);
        await context.SaveChangesAsync();
    }
}
