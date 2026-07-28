namespace Server.Integrations.OpenAi;

/// <summary>AI-generated diagnosis for a photo of a plant, produced by <see cref="IPlantScanClient"/>.</summary>
public class PlantScanResult
{
    /// <summary>Whether the photo actually shows a plant/crop the model could assess.</summary>
    public bool PlantDetected { get; set; }

    public string PlantName { get; set; } = string.Empty;

    public bool IsHealthy { get; set; }

    /// <summary>Empty when <see cref="IsHealthy"/> is true or no plant was detected.</summary>
    public string DiseaseName { get; set; } = string.Empty;

    /// <summary>One of "None", "Low", "Medium", "High".</summary>
    public string Severity { get; set; } = "None";

    /// <summary>Model's confidence in the diagnosis, from 0 to 1.</summary>
    public double Confidence { get; set; }

    public string Summary { get; set; } = string.Empty;

    public List<string> Symptoms { get; set; } = [];

    public List<string> Treatments { get; set; } = [];

    public List<string> PreventionTips { get; set; } = [];
}
