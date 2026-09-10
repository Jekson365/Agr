namespace Server.Models;

public class SoilInvestigation
{
    public int Id { get; set; }
    public int LandPlotId { get; set; }
    public DateOnly InvestigationDate { get; set; }
    public DateOnly? SamplingDate { get; set; }
    public decimal? SamplingDepthCm { get; set; }
    public string Laboratory { get; set; } = string.Empty;
    public string SampleNumber { get; set; } = string.Empty;
    public SoilInvestigationStatus Status { get; set; } = SoilInvestigationStatus.Draft;
    public string Notes { get; set; } = string.Empty;
    public string ReportPath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
