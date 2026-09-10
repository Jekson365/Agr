using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public partial class SoilFertilityScoringService(AppDbContext context) : ISoilFertilityScoringService
{
    public const string ExplainMatched = "matched";
    public const string ExplainNoParameter = "noParameter";
    public const string ExplainNoValue = "noValue";
    public const string ExplainNoRule = "noRule";

    public async Task<SoilReferenceData> GetReferenceDataAsync()
    {
        var ruleSet = await ActiveRuleSetAsync();
        return new SoilReferenceData
        {
            RuleSet = ruleSet,
            Parameters = await context.SoilParameterDefinitions.AsNoTracking().OrderBy(p => p.SortOrder).ToListAsync(),
            Categories = await context.SoilParameterCategories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync(),
            Factors = ruleSet is null
                ? []
                : await context.SoilFertilityFactors.AsNoTracking()
                    .Where(f => f.RuleSetId == ruleSet.Id).OrderBy(f => f.SortOrder).ToListAsync(),
            FertilityCategories = ruleSet is null
                ? []
                : await context.SoilFertilityCategories.AsNoTracking()
                    .Where(c => c.RuleSetId == ruleSet.Id).OrderBy(c => c.SortOrder).ToListAsync(),
        };
    }

    public async Task<SoilFertilityAssessmentDetail?> EvaluateAsync(int investigationId)
    {
        var investigation = await context.SoilInvestigations.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == investigationId);
        if (investigation is null)
        {
            return null;
        }

        var ruleSet = await ActiveRuleSetAsync();
        if (ruleSet is null)
        {
            return null;
        }

        var results = await context.SoilInvestigationResults.AsNoTracking()
            .Where(r => r.SoilInvestigationId == investigationId).ToListAsync();
        var factors = await context.SoilFertilityFactors.AsNoTracking()
            .Where(f => f.RuleSetId == ruleSet.Id).OrderBy(f => f.SortOrder).ToListAsync();
        var rules = await context.SoilScoringRules.AsNoTracking()
            .Where(r => r.RuleSetId == ruleSet.Id).ToListAsync();
        var categories = await context.SoilParameterCategories.AsNoTracking().ToListAsync();

        var detail = new SoilFertilityAssessmentDetail
        {
            Assessment = new SoilFertilityAssessment
            {
                LandPlotId = investigation.LandPlotId,
                SoilInvestigationId = investigationId,
                RuleSetId = ruleSet.Id,
                MaxScore = ruleSet.MaxScore,
                CalculatedAt = DateTime.UtcNow,
            },
        };

        decimal total = 0;
        var complete = true;

        foreach (var factor in factors)
        {
            var row = Score(factor, results, rules, categories, ruleSet.PointSelection);
            detail.Results.Add(row);

            if (row.Points is decimal points)
            {
                total += points;
            }
            else if (factor.IsRequired)
            {
                complete = false;
                detail.MissingFactors.Add(factor.Key);
            }
        }

        detail.Assessment.Score = complete ? total : 0;
        detail.Assessment.IsComplete = complete;
        detail.Assessment.CategoryId = complete
            ? SoilScoringEvaluator.CategoryFor(
                await context.SoilFertilityCategories.AsNoTracking().Where(c => c.RuleSetId == ruleSet.Id).ToListAsync(),
                total)?.Id
            : null;
        detail.Limitations = complete
            ? detail.Results
                .Where(r => r.Points is decimal p && p < r.MaximumPoints)
                .OrderByDescending(r => r.MaximumPoints - (r.Points ?? 0))
                .Take(3)
                .Select(r => r.FactorKey)
                .ToList()
            : [];

        return detail;
    }

    private static SoilFertilityAssessmentResult Score(
        SoilFertilityFactor factor,
        List<SoilInvestigationResult> results,
        List<SoilScoringRule> rules,
        List<SoilParameterCategory> categories,
        SoilPointSelection selection)
    {
        var row = new SoilFertilityAssessmentResult
        {
            FactorId = factor.Id,
            FactorKey = factor.Key,
            MaximumPoints = factor.MaxPoints,
        };

        if (factor.ParameterId is not int parameterId)
        {
            row.Explanation = ExplainNoParameter;
            return row;
        }

        var result = results.FirstOrDefault(r => r.ParameterId == parameterId && r.Form == factor.Form);
        if (result is null || (result.NumericValue is null && result.CategoryId is null))
        {
            row.Explanation = ExplainNoValue;
            return row;
        }

        row.HasData = true;
        row.InputValue = result.CategoryId is int categoryId
            ? categories.FirstOrDefault(c => c.Id == categoryId)?.Key ?? string.Empty
            : result.NumericValue?.ToString() ?? string.Empty;

        var factorRules = rules.Where(r => r.FactorId == factor.Id);
        var rule = SoilScoringEvaluator.Match(factorRules, result);
        if (rule is null)
        {
            row.Explanation = ExplainNoRule;
            return row;
        }

        row.PointsMin = rule.PointsMin;
        row.PointsMax = rule.PointsMax;
        row.Points = SoilScoringEvaluator.SelectPoints(rule, selection, result.NumericValue);
        row.Explanation = ExplainMatched;
        return row;
    }

    private Task<SoilScoringRuleSet?> ActiveRuleSetAsync()
    {
        return context.SoilScoringRuleSets.AsNoTracking()
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.EffectiveFrom)
            .ThenByDescending(r => r.Id)
            .FirstOrDefaultAsync();
    }
}
