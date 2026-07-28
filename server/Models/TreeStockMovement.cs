namespace Server.Models;

/// <summary>A single change to a <see cref="TreeStock"/>'s amount, tagged with what caused it.</summary>
public class TreeStockMovement
{
    public int Id { get; set; }
    public int TreeStockId { get; set; }

    /// <summary>
    /// The harvest item this movement represents, if <see cref="Source"/> is <see cref="StockMovementSource.Harvest"/>.
    /// Editing that item updates this same row instead of logging a new one.
    /// </summary>
    public int? HarvestItemId { get; set; }

    /// <summary>
    /// The harvest result this movement represents, if it was caused by a recorded final yield
    /// instead of a harvest item. Editing that result updates this same row instead of logging a
    /// new one.
    /// </summary>
    public int? HarvestResultId { get; set; }

    /// <summary>The marketplace listing this sale came from — see
    /// <see cref="StockMovement.MarketListingId"/>.</summary>
    public int? MarketListingId { get; set; }

    public decimal Delta { get; set; }
    public StockMovementSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
