namespace Server.Models;

/// <summary>
/// A <see cref="TreeProductMovement"/> carrying the date of the harvest behind it, resolved
/// through the <see cref="HarvestProduct"/> row it belongs to. The movement's own
/// <see cref="TreeProductMovement.CreatedAt"/> is only when the row was written — which is not
/// the same day the fruit was picked, and moves again whenever a harvest is re-marked harvested.
/// The ledger reads under the harvest's date instead, so it lines up with the harvest itself.
/// </summary>
public class TreeProductMovementDto
{
    public int Id { get; set; }
    public int TreeProductId { get; set; }
    public int? HarvestProductId { get; set; }
    public decimal Delta { get; set; }
    public TreeProductMovementSource Source { get; set; }

    public string? Note { get; set; }

    public DateOnly? Date { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>The date of the harvest this came from; null for manual and market movements,
    /// which have no harvest and are dated by <see cref="CreatedAt"/>.</summary>
    public DateOnly? HarvestDate { get; set; }
}
