namespace Server.Models;

public class SoilFertilityAssessment
{
    public int Id { get; set; }
    public int LandPlotId { get; set; }
    public int SoilInvestigationId { get; set; }
    public int RuleSetId { get; set; }
    public decimal Score { get; set; }
    public int MaxScore { get; set; }
    public int? CategoryId { get; set; }
    public bool IsComplete { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
