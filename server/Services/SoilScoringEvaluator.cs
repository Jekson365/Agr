using Server.Models;

namespace Server.Services;

public static class SoilScoringEvaluator
{
    public static SoilScoringRule? Match(IEnumerable<SoilScoringRule> rules, SoilInvestigationResult result)
    {
        foreach (var rule in rules.OrderBy(r => r.Priority).ThenBy(r => r.Id))
        {
            if (rule.Condition == SoilRuleCondition.Category)
            {
                if (result.CategoryId is not null && rule.CategoryId == result.CategoryId)
                {
                    return rule;
                }

                continue;
            }

            if (result.NumericValue is not decimal value)
            {
                continue;
            }

            if (rule.MinValue is decimal min)
            {
                if (rule.MinInclusive ? value < min : value <= min)
                {
                    continue;
                }
            }

            if (rule.MaxValue is decimal max)
            {
                if (rule.MaxInclusive ? value > max : value >= max)
                {
                    continue;
                }
            }

            return rule;
        }

        return null;
    }

    public static decimal SelectPoints(SoilScoringRule rule, SoilPointSelection mode, decimal? value)
    {
        if (rule.PointsMin == rule.PointsMax)
        {
            return rule.PointsMin;
        }

        return mode switch
        {
            SoilPointSelection.Maximum => rule.PointsMax,
            SoilPointSelection.Midpoint => (rule.PointsMin + rule.PointsMax) / 2m,
            SoilPointSelection.Interpolate => Interpolate(rule, value),
            _ => rule.PointsMin,
        };
    }

    private static decimal Interpolate(SoilScoringRule rule, decimal? value)
    {
        if (rule.Condition != SoilRuleCondition.Range
            || value is not decimal measured
            || rule.MinValue is not decimal min
            || rule.MaxValue is not decimal max
            || max <= min)
        {
            return rule.PointsMin;
        }

        var position = (measured - min) / (max - min);
        position = Math.Clamp(position, 0m, 1m);
        return rule.PointsMin + position * (rule.PointsMax - rule.PointsMin);
    }

    public static SoilFertilityCategory? CategoryFor(IEnumerable<SoilFertilityCategory> categories, decimal score)
    {
        var rounded = Math.Round(score, MidpointRounding.AwayFromZero);
        return categories.FirstOrDefault(c => rounded >= c.MinScore && rounded <= c.MaxScore);
    }
}
