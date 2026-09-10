namespace Server.Models;

public class SoilFertilityAssessmentResult
{
    public int Id { get; set; }
    public int AssessmentId { get; set; }
    public int FactorId { get; set; }
    public string FactorKey { get; set; } = string.Empty;
    public string InputValue { get; set; } = string.Empty;
    public decimal? Points { get; set; }
    public decimal PointsMin { get; set; }
    public decimal PointsMax { get; set; }
    public int MaximumPoints { get; set; }
    public bool HasData { get; set; }
    public string Explanation { get; set; } = string.Empty;
}
