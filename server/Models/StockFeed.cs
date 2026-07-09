namespace Server.Models;

/// <summary>
/// What a livestock group is fed: links a <see cref="Livestock"/> group to a <see cref="Stock"/>
/// good and how much of it the animals eat.
/// </summary>
public class StockFeed
{
    public int Id { get; set; }
    public int LivestockId { get; set; }
    public int StockId { get; set; }
    public decimal Amount { get; set; }
}
