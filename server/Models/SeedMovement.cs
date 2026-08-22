namespace Server.Models;

public enum SeedMovementSource
{
    Manual,

    /// <summary>Seed consumed by sowing, recorded on a harvest (see <see cref="HarvestSeed"/>).</summary>
    Harvest,

    /// <summary>Seed bought in, recorded on a <see cref="PurchaseDocument"/>.</summary>
    Purchase,
}

/// <summary>A single change to a <see cref="Seed"/>'s amount, tagged with what caused it —
/// the seed-side counterpart of <see cref="StockMovement"/>.</summary>
public class SeedMovement
{
    public int Id { get; set; }
    public int SeedId { get; set; }

    /// <summary>
    /// The harvest's seed usage this movement represents, when <see cref="Source"/> is
    /// <see cref="SeedMovementSource.Harvest"/>. Editing that row updates this same movement
    /// instead of logging a new one, so the history can't drift from the balance.
    /// </summary>
    public int? HarvestSeedId { get; set; }

    /// <summary>Signed change to the amount — negative when seed is sown.</summary>
    public decimal Delta { get; set; }
    public SeedMovementSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
