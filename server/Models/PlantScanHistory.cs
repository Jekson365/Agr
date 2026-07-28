namespace Server.Models;

/// <summary>A saved record of one AI plant-scan analysis, so a user can browse past scans.</summary>
public class PlantScanHistory
{
    public int Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public bool PlantDetected { get; set; }
    public string PlantName { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public string DiseaseName { get; set; } = string.Empty;
    public string Severity { get; set; } = "None";
    public double Confidence { get; set; }
    public string Summary { get; set; } = string.Empty;
    public List<string> Symptoms { get; set; } = [];
    public List<string> Treatments { get; set; } = [];
    public List<string> PreventionTips { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
