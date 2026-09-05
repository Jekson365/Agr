using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeTreatmentRepository(AppDbContext context) : ITreeTreatmentRepository
{
    public async Task<IEnumerable<TreeTreatment>> GetAsync(int? treeStockId = null)
    {
        var query = context.TreeTreatments.AsNoTracking().AsQueryable();
        if (treeStockId is not null)
        {
            query = query.Where(t => t.TreeStockId == treeStockId);
        }

        return await query.OrderBy(t => t.Date).ThenBy(t => t.Id).ToListAsync();
    }

    public async Task<TreeTreatment> AddAsync(TreeTreatment treatment)
    {
        context.TreeTreatments.Add(treatment);
        await context.SaveChangesAsync();
        return treatment;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.TreeTreatments.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.TreeTreatments.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
