namespace Server.Models;

/// <summary>
/// What a livestock group is fed: links a <see cref="Livestock"/> group to exactly one of a
/// <see cref="Stock"/> good, a <see cref="TreeProduct"/> or a piece of <see cref="Equipment"/>,
/// and how much of it the animals eat.
/// </summary>
public class StockFeed
{
    public int Id { get; set; }
    public int LivestockId { get; set; }
    public int? StockId { get; set; }
    public int? TreeProductId { get; set; }
    public int? EquipmentId { get; set; }
    public decimal Amount { get; set; }
}
