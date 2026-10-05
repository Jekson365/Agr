namespace Server.Models;

public class WineStageChange
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public WineStage? FromStage { get; set; }
    public WineStage ToStage { get; set; }
    public DateOnly Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
