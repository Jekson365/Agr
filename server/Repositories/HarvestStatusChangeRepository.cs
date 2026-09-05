using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestStatusChangeRepository(AppDbContext context) : IHarvestStatusChangeRepository
{
    public async Task<IEnumerable<HarvestStatusChange>> GetAsync(int? harvestId = null)
    {
        var query = context.HarvestStatusChanges.AsNoTracking().AsQueryable();
        if (harvestId is not null)
        {
            query = query.Where(c => c.HarvestId == harvestId);
        }

        return await query.OrderBy(c => c.Id).ToListAsync();
    }

    public async Task<bool> UpdateAsync(HarvestStatusChange change)
    {
        var existing = await context.HarvestStatusChanges.FindAsync(change.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Date = change.Date;
        existing.Note = change.Note;

        await context.SaveChangesAsync();
        return true;
    }
}
