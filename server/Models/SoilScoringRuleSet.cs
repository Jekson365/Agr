namespace Server.Models;

public class SoilScoringRuleSet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
    public int MaxScore { get; set; } = 100;
    public SoilPointSelection PointSelection { get; set; } = SoilPointSelection.Minimum;
    public string Notes { get; set; } = string.Empty;
}
