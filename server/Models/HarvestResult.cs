namespace Server.Models;

/// <summary>
/// The final, actual yield of a <see cref="Stock"/> good or <see cref="TreeStock"/> fruit
/// recorded once a <see cref="Harvest"/> is marked Harvested. Distinct from
/// <see cref="HarvestItem"/> (the planned items) — this is what actually adjusts stock, and can
/// only be written while the harvest is Harvested. Belongs to exactly one of the two (
/// <see cref="StockId"/> set for a plant-stock good, <see cref="TreeStockId"/> set for a
/// fruit-tree good).
/// </summary>
public class HarvestResult
{
    public int Id { get; set; }
    public int HarvestId { get; set; }

    /// <summary>Set when this result is a plant-stock good; null for a fruit-tree result.</summary>
    public int? StockId { get; set; }

    /// <summary>Set when this result is a fruit-tree good; null for a plant-stock result.</summary>
    public int? TreeStockId { get; set; }

    public decimal Amount { get; set; }
}
