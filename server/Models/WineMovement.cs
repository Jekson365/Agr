namespace Server.Models;

public class WineMovement
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public decimal Delta { get; set; }
    public int BottleDelta { get; set; }
    public WineMovementSource Source { get; set; }
    public string? Note { get; set; }
    public DateOnly Date { get; set; }
    public int? WineBottlingId { get; set; }
    public int? WineOperationId { get; set; }
    public int? MarketOrderId { get; set; }
    public decimal? Revenue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
