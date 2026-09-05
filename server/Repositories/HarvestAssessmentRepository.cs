using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>A good's assessment is read and written as a whole sheet: saving replaces the lines it
/// had rather than reconciling them one by one, so a band the farm stopped using goes with it.</summary>
public class HarvestAssessmentRepository(AppDbContext context) : IHarvestAssessmentRepository
{
    public async Task<IEnumerable<HarvestAssessment>> GetAsync(int? harvestId, int? stockId, int? treeStockId)
    {
        var query = context.HarvestAssessments.AsNoTracking().AsQueryable();

        if (harvestId is not null)
        {
            query = query.Where(a => a.HarvestId == harvestId);
        }

        if (stockId is not null)
        {
            query = query.Where(a => a.StockId == stockId);
        }

        if (treeStockId is not null)
        {
            query = query.Where(a => a.TreeStockId == treeStockId);
        }

        return await query.OrderBy(a => a.Id).ToListAsync();
    }

    public async Task<IEnumerable<HarvestAssessment>> SaveSheetAsync(HarvestAssessmentSheet sheet)
    {
        var existing = await context.HarvestAssessments
            .Where(a => a.HarvestId == sheet.HarvestId
                && a.StockId == sheet.StockId
                && a.TreeStockId == sheet.TreeStockId)
            .ToListAsync();

        context.HarvestAssessments.RemoveRange(existing);

        var saved = sheet.Lines
            .Select(line => new HarvestAssessment
            {
                HarvestId = sheet.HarvestId,
                StockId = sheet.StockId,
                TreeStockId = sheet.TreeStockId,
                Grade = line.Grade,
                Quantity = line.Quantity,
                Wasted = line.Wasted,
            })
            .ToList();

        await context.HarvestAssessments.AddRangeAsync(saved);
        await context.SaveChangesAsync();
        return saved;
    }
}
