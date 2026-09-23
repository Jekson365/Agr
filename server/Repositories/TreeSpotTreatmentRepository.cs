using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeSpotTreatmentRepository(AppDbContext context) : ITreeSpotTreatmentRepository
{
    public async Task<IEnumerable<TreeSpotTreatment>> GetAsync(int? treeStockId = null)
    {
        var query = context.TreeSpotTreatments.AsNoTracking().AsQueryable();
        if (treeStockId is not null)
        {
            query = query.Where(t => t.TreeStockId == treeStockId);
        }

        return await query.OrderByDescending(t => t.Date).ThenByDescending(t => t.Id).ToListAsync();
    }

    public async Task<IEnumerable<TreeSpotTreatment>> AddRangeAsync(IEnumerable<TreeSpotTreatment> treatments)
    {
        var rows = treatments.ToList();
        context.TreeSpotTreatments.AddRange(rows);
        await context.SaveChangesAsync();
        return rows;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.TreeSpotTreatments.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.TreeSpotTreatments.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
