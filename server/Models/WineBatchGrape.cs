namespace Server.Models;

public class WineBatchGrape
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public int TreeProductId { get; set; }
    public decimal Amount { get; set; }
}
