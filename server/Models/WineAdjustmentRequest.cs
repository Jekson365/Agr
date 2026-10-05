namespace Server.Models;

public class WineAdjustmentRequest
{
    public int WineBatchId { get; set; }
    public decimal Delta { get; set; }
    public int BottleDelta { get; set; }
    public int? WineBottlingId { get; set; }
    public string? Note { get; set; }
    public DateOnly? Date { get; set; }
}
