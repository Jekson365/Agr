namespace Server.Models;

public enum StockMovementSource
{
    Manual,
    Harvest,

    /// <summary>The amount was sold via a marketplace listing (see <see cref="MarketListing"/>).</summary>
    Market,
}

/// <summary>A single change to a <see cref="Stock"/>'s amount, tagged with what caused it.</summary>
public class StockMovement
{
    public int Id { get; set; }
    public int StockId { get; set; }

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

    /// <summary>
    /// The marketplace listing this sale was recorded from, when <see cref="Source"/> is
    /// <see cref="StockMovementSource.Market"/>. A plain id rather than a foreign key: listings
    /// live in the shared master database while movements live in the tenant's own. Deleting the
    /// movement uses it to put the listing back the way it was.
    /// </summary>
    public int? MarketListingId { get; set; }

    public decimal Delta { get; set; }
    public StockMovementSource Source { get; set; }

    public string? Note { get; set; }

    public DateOnly? Date { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
