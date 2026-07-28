namespace Server.Models;

/// <summary>
/// How much of a specific <see cref="Stock"/> good or <see cref="TreeStock"/> fruit was collected
/// within a <see cref="Harvest"/>. Belongs to exactly one of the two (<see cref="StockId"/> set
/// for a plant-stock good, <see cref="TreeStockId"/> set for a fruit-tree good).
/// </summary>
public class HarvestItem
{
    public int Id { get; set; }
    public int HarvestId { get; set; }

    /// <summary>Set when this item is a plant-stock good; null for a fruit-tree item.</summary>
    public int? StockId { get; set; }

    /// <summary>Set when this item is a fruit-tree good; null for a plant-stock item.</summary>
    public int? TreeStockId { get; set; }

    public decimal Amount { get; set; }

    /// <summary>
    /// The unit <see cref="Amount"/> is planned in — a <see cref="StockUnit"/> or
    /// <see cref="TreeStockUnit"/> name, held as a plain string since either catalog can supply it.
    /// A plan may use a different unit than the good is stocked in, so it is stored per row rather
    /// than read off the target. Left blank by a client, it falls back to the target's own unit.
    /// </summary>
    public string Unit { get; set; } = string.Empty;
}
