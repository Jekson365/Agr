namespace Server.Models;

public class WineSaleRequest
{
    public int WineBatchId { get; set; }
    public decimal Quantity { get; set; }
    public bool Bottles { get; set; }
    public int? WineBottlingId { get; set; }
    public decimal? Revenue { get; set; }
    public DateOnly? Date { get; set; }
}
