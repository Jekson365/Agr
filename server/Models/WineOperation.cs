namespace Server.Models;

public class WineOperation
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public DateOnly Date { get; set; }
    public WineOperationKind Kind { get; set; }
    public string? Note { get; set; }
    public decimal? Cost { get; set; }
    public decimal? LitersLost { get; set; }
}
