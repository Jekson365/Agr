using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class WineMeasurementRepository(AppDbContext context) : IWineRecordRepository<WineMeasurement>
{
    public async Task<IEnumerable<WineMeasurement>> GetAsync(int? wineBatchId = null)
    {
        var query = context.WineMeasurements.AsNoTracking().AsQueryable();
        if (wineBatchId is not null)
        {
            query = query.Where(m => m.WineBatchId == wineBatchId);
        }

        return await query.OrderBy(m => m.Date).ThenBy(m => m.Id).ToListAsync();
    }

    public async Task<WineMeasurement?> GetByIdAsync(int id)
    {
        return await context.WineMeasurements.FindAsync(id);
    }

    public async Task<WineMeasurement> AddAsync(WineMeasurement record)
    {
        context.WineMeasurements.Add(record);
        await context.SaveChangesAsync();
        return record;
    }

    public async Task UpdateAsync(WineMeasurement record)
    {
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(WineMeasurement record)
    {
        context.WineMeasurements.Remove(record);
        await context.SaveChangesAsync();
    }
}
