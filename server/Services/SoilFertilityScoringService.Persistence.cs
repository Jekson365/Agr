using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Services;

public partial class SoilFertilityScoringService
{
    public async Task<SoilFertilityAssessmentDetail?> CalculateAsync(int investigationId)
    {
        var detail = await EvaluateAsync(investigationId);
        if (detail is null)
        {
            return null;
        }

        var existing = await context.SoilFertilityAssessments
            .FirstOrDefaultAsync(a => a.SoilInvestigationId == investigationId);

        if (existing is null)
        {
            context.SoilFertilityAssessments.Add(detail.Assessment);
            await context.SaveChangesAsync();
        }
        else
        {
            var stale = await context.SoilFertilityAssessmentResults
                .Where(r => r.AssessmentId == existing.Id).ToListAsync();
            context.SoilFertilityAssessmentResults.RemoveRange(stale);

            existing.RuleSetId = detail.Assessment.RuleSetId;
            existing.Score = detail.Assessment.Score;
            existing.MaxScore = detail.Assessment.MaxScore;
            existing.CategoryId = detail.Assessment.CategoryId;
            existing.IsComplete = detail.Assessment.IsComplete;
            existing.CalculatedAt = detail.Assessment.CalculatedAt;
            await context.SaveChangesAsync();

            detail.Assessment = existing;
        }

        foreach (var row in detail.Results)
        {
            row.Id = 0;
            row.AssessmentId = detail.Assessment.Id;
        }

        context.SoilFertilityAssessmentResults.AddRange(detail.Results);
        await context.SaveChangesAsync();
        return detail;
    }

    public async Task<SoilFertilityAssessmentDetail?> GetAsync(int investigationId)
    {
        var assessment = await context.SoilFertilityAssessments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.SoilInvestigationId == investigationId);
        if (assessment is null)
        {
            return null;
        }

        var results = await context.SoilFertilityAssessmentResults.AsNoTracking()
            .Where(r => r.AssessmentId == assessment.Id)
            .OrderBy(r => r.Id)
            .ToListAsync();

        return new SoilFertilityAssessmentDetail
        {
            Assessment = assessment,
            Results = results,
            MissingFactors = results.Where(r => r.Points is null).Select(r => r.FactorKey).ToList(),
            Limitations = assessment.IsComplete
                ? results
                    .Where(r => r.Points is decimal p && p < r.MaximumPoints)
                    .OrderByDescending(r => r.MaximumPoints - (r.Points ?? 0))
                    .Take(3)
                    .Select(r => r.FactorKey)
                    .ToList()
                : [],
        };
    }

    public async Task<List<SoilFertilityAssessment>> HistoryAsync(int landPlotId)
    {
        return await context.SoilFertilityAssessments.AsNoTracking()
            .Where(a => a.LandPlotId == landPlotId)
            .OrderBy(a => a.CalculatedAt)
            .ToListAsync();
    }
}
