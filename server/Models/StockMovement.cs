namespace Server.Models;

public enum StockMovementSource
{
    Manual,
    Harvest,
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
    public decimal Delta { get; set; }
    public StockMovementSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
