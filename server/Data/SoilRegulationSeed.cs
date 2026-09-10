using Server.Models;

namespace Server.Data;

public static class SoilRegulationSeed
{
    public const int RuleSetId = 1;

    public const int FactorRelief = 1;
    public const int FactorVegetationCover = 2;
    public const int FactorMechanicalComposition = 3;
    public const int FactorStructure = 4;
    public const int FactorHumus = 5;
    public const int FactorAcidityAlkalinity = 6;
    public const int FactorHydrophysical = 7;
    public const int FactorSoilQuality = 8;
    public const int FactorPh = 9;

    public static readonly SoilScoringRuleSet[] RuleSets =
    [
        new()
        {
            Id = RuleSetId,
            Name = "Georgian Soil Fertility Assessment",
            Source = "Technical Regulation",
            Version = "unverified",
            EffectiveFrom = new DateOnly(2014, 1, 1),
            IsActive = true,
            MaxScore = 100,
            PointSelection = SoilPointSelection.Minimum,
            Notes = "Seeded from the task specification, not from the regulation document. "
                + "Rules are supplied for mechanical composition, structure and pH only. "
                + "Humus, relief, vegetation cover, absorbed bases, hydrophysical properties and the "
                + "soil quality factor have no rules until the regulation tables are provided.",
        },
    ];

    public static readonly SoilFertilityFactor[] Factors =
    [
        new() { Id = FactorRelief, RuleSetId = RuleSetId, Key = "relief", MinPoints = 1, MaxPoints = 5, SortOrder = 1, ParameterId = SoilParameterSeed.Relief },
        new() { Id = FactorVegetationCover, RuleSetId = RuleSetId, Key = "vegetationCover", MinPoints = 1, MaxPoints = 5, SortOrder = 2, ParameterId = SoilParameterSeed.VegetationCover },
        new() { Id = FactorMechanicalComposition, RuleSetId = RuleSetId, Key = "mechanicalComposition", MinPoints = 1, MaxPoints = 10, SortOrder = 3, ParameterId = SoilParameterSeed.MechanicalComposition },
        new() { Id = FactorStructure, RuleSetId = RuleSetId, Key = "structure", MinPoints = 1, MaxPoints = 5, SortOrder = 4, ParameterId = SoilParameterSeed.SoilStructure },
        new() { Id = FactorHumus, RuleSetId = RuleSetId, Key = "humus", MinPoints = 1, MaxPoints = 30, SortOrder = 5, ParameterId = SoilParameterSeed.Humus },
        new() { Id = FactorAcidityAlkalinity, RuleSetId = RuleSetId, Key = "acidityAlkalinity", MinPoints = 1, MaxPoints = 15, SortOrder = 6, ParameterId = SoilParameterSeed.AbsorbedBaseComposition },
        new() { Id = FactorHydrophysical, RuleSetId = RuleSetId, Key = "hydrophysicalProperties", MinPoints = 1, MaxPoints = 10, SortOrder = 7, ParameterId = null },
        new() { Id = FactorSoilQuality, RuleSetId = RuleSetId, Key = "soilQuality", MinPoints = 1, MaxPoints = 10, SortOrder = 8, ParameterId = null },
        new() { Id = FactorPh, RuleSetId = RuleSetId, Key = "ph", MinPoints = 1, MaxPoints = 10, SortOrder = 9, ParameterId = SoilParameterSeed.Ph },
    ];

    public static readonly SoilFertilityCategory[] FertilityCategories =
    [
        new() { Id = 1, RuleSetId = RuleSetId, Key = "highlyFertile", MinScore = 81, MaxScore = 100, SortOrder = 1 },
        new() { Id = 2, RuleSetId = RuleSetId, Key = "fertile", MinScore = 71, MaxScore = 80, SortOrder = 2 },
        new() { Id = 3, RuleSetId = RuleSetId, Key = "moderatelyFertile", MinScore = 61, MaxScore = 70, SortOrder = 3 },
        new() { Id = 4, RuleSetId = RuleSetId, Key = "lowFertility", MinScore = 41, MaxScore = 60, SortOrder = 4 },
        new() { Id = 5, RuleSetId = RuleSetId, Key = "infertile", MinScore = 21, MaxScore = 40, SortOrder = 5 },
        new() { Id = 6, RuleSetId = RuleSetId, Key = "veryPoor", MinScore = 0, MaxScore = 20, SortOrder = 6 },
    ];

    public static readonly SoilScoringRule[] Rules =
    [
        Category(1, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 1, 9, 10, 1),
        Category(2, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 2, 8, 9, 2),
        Category(3, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 3, 6, 8, 3),
        Category(4, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 4, 5, 6, 4),
        Category(5, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 5, 3, 4, 5),
        Category(6, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 6, 2, 2, 6),
        Category(7, FactorMechanicalComposition, SoilParameterSeed.MechanicalComposition, 7, 1, 1, 7),

        Category(8, FactorStructure, SoilParameterSeed.SoilStructure, 8, 5, 5, 1),
        Category(9, FactorStructure, SoilParameterSeed.SoilStructure, 9, 3, 4, 2),
        Category(10, FactorStructure, SoilParameterSeed.SoilStructure, 10, 2, 3, 3),
        Category(11, FactorStructure, SoilParameterSeed.SoilStructure, 11, 1, 1, 4),

        Range(12, FactorPh, SoilParameterSeed.Ph, 6.5m, 7.0m, true, 9, 10, 1),
        Range(13, FactorPh, SoilParameterSeed.Ph, 5.0m, 6.5m, false, 6, 9, 2),
        Range(14, FactorPh, SoilParameterSeed.Ph, 4.0m, 5.0m, false, 4, 6, 3),
        Range(15, FactorPh, SoilParameterSeed.Ph, 3.0m, 4.0m, false, 2, 4, 4),
        Range(16, FactorPh, SoilParameterSeed.Ph, null, 3.0m, false, 1, 1, 5),
    ];

    private static SoilScoringRule Category(int id, int factorId, int parameterId, int categoryId, decimal min, decimal max, int priority)
    {
        return new SoilScoringRule
        {
            Id = id,
            RuleSetId = RuleSetId,
            FactorId = factorId,
            ParameterId = parameterId,
            Condition = SoilRuleCondition.Category,
            CategoryId = categoryId,
            PointsMin = min,
            PointsMax = max,
            Priority = priority,
        };
    }

    private static SoilScoringRule Range(int id, int factorId, int parameterId, decimal? minValue, decimal? maxValue, bool maxInclusive, decimal min, decimal max, int priority)
    {
        return new SoilScoringRule
        {
            Id = id,
            RuleSetId = RuleSetId,
            FactorId = factorId,
            ParameterId = parameterId,
            Condition = SoilRuleCondition.Range,
            MinValue = minValue,
            MaxValue = maxValue,
            MinInclusive = true,
            MaxInclusive = maxInclusive,
            PointsMin = min,
            PointsMax = max,
            Priority = priority,
        };
    }
}
