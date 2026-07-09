namespace Server.Models;

/// <summary>A recorded harvest event — a title and date under which stock items are logged.</summary>
public class Harvest
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public HarvestStatus Status { get; set; } = HarvestStatus.Planning;
    public int? LandPlotId { get; set; }
}
