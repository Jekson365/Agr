using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>A good's grading standard is read and written whole: saving replaces its bands rather
/// than reconciling them one by one, so a band the farm stopped using goes with it. The harvests
/// already graded against it keep their figures — they record a band by name, not by row.</summary>
public class AssessmentCriteriaRepository(AppDbContext context) : IAssessmentCriteriaRepository
{
    public async Task<IEnumerable<AssessmentCriteria>> GetAsync(int? stockId, int? treeStockId)
    {
        var query = context.AssessmentCriteria.AsNoTracking().AsQueryable();

        if (stockId is not null)
        {
            query = query.Where(c => c.StockId == stockId);
        }

        if (treeStockId is not null)
        {
            query = query.Where(c => c.TreeStockId == treeStockId);
        }

        return await query.OrderBy(c => c.Grade).ThenBy(c => c.Id).ToListAsync();
    }

    public async Task<IEnumerable<AssessmentCriteria>> SaveSheetAsync(AssessmentCriteriaSheet sheet)
    {
        var existing = await context.AssessmentCriteria
            .Where(c => c.StockId == sheet.StockId && c.TreeStockId == sheet.TreeStockId)
            .ToListAsync();

        context.AssessmentCriteria.RemoveRange(existing);

        var saved = sheet.Lines
            .Select(line => new AssessmentCriteria
            {
                StockId = sheet.StockId,
                TreeStockId = sheet.TreeStockId,
                Grade = line.Grade,
                IsActive = line.IsActive,
                SizeFrom = line.SizeFrom,
                SizeTo = line.SizeTo,
                WeightFrom = line.WeightFrom,
                WeightTo = line.WeightTo,
                Damaged = line.Damaged,
                Rotten = line.Rotten,
                Moisture = line.Moisture,
                Color = line.Color.Trim(),
            })
            .ToList();

        await context.AssessmentCriteria.AddRangeAsync(saved);
        await context.SaveChangesAsync();
        return saved;
    }
}
