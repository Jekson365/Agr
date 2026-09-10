namespace Server.Models;

public class SoilScoringRule
{
    public int Id { get; set; }
    public int RuleSetId { get; set; }
    public int FactorId { get; set; }
    public int? ParameterId { get; set; }
    public SoilNutrientForm Form { get; set; } = SoilNutrientForm.None;
    public SoilRuleCondition Condition { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool MinInclusive { get; set; } = true;
    public bool MaxInclusive { get; set; }
    public decimal PointsMin { get; set; }
    public decimal PointsMax { get; set; }
    public int Priority { get; set; }
}
