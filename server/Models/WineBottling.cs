namespace Server.Models;

public class WineBottling
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public DateOnly Date { get; set; }
    public decimal BottleSize { get; set; }
    public int Count { get; set; }
    public string? Lot { get; set; }
    public decimal? Cost { get; set; }
}
