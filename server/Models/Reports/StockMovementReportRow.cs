using Server.Models;

namespace Server.Models.Reports;

/// <summary>
/// One row of the plant/fruit stock-movement report: a single StockMovement or
/// TreeStockMovement joined with the Stock/TreeStock it belongs to, so the /farm/balance report
/// can show which product changed (name, type, unit) without a second lookup on the client.
/// Belongs to exactly one of <see cref="StockId"/> (a plant-stock good) or
/// <see cref="TreeStockId"/> (a fruit-tree good).
/// </summary>
public class StockMovementReportRow
{
    public int Id { get; set; }
    public int? StockId { get; set; }
    public int? TreeStockId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    /// <summary>The unit's readable name (e.g. "Kilogram", "Box") — plain string since Stock and
    /// TreeStock draw from different unit enums.</summary>
    public string Unit { get; set; } = string.Empty;
    public decimal Delta { get; set; }
    public StockMovementSource Source { get; set; }

    /// <summary>The harvest this movement came from, for rows with
    /// <see cref="StockMovementSource.Harvest"/>; null for manual edits and market sales.</summary>
    public string? HarvestTitle { get; set; }

    public DateTime CreatedAt { get; set; }
}
