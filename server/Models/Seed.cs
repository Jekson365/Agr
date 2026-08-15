namespace Server.Models;

public enum SeedUnit
{
    Kilogram,
    Gram,

    /// <summary>Counted seeds or seedlings rather than weighed, e.g. 200 tomato seedlings.</summary>
    Quantity,
}

/// <summary>
/// Sowing seed the farm holds, e.g. 12 kg of Roma tomato seed. Kept separately from
/// <see cref="Stock"/> because seed is an input that gets consumed by planting, not produce the
/// farm has to sell — a harvest records how much of it was used (see <see cref="HarvestSeed"/>).
/// </summary>
public class Seed
{
    public int Id { get; set; }

    /// <summary>The crop this seed grows, carried as a <see cref="StockKind"/> name so it shares
    /// the same catalog, icons and labels as the produce it eventually becomes. Not a foreign
    /// key, matching <see cref="Stock.Type"/>.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional label telling apart seeds of the same crop, e.g. "Roma" or "Cherry".</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public SeedUnit Unit { get; set; }

    /// <summary>
    /// Set when the stock this seed grows into is removed (see <see cref="Stock.IsDeleted"/>) —
    /// the pair is created together by <c>POST /api/stocks/with-seed</c> and goes together. Like a
    /// deleted stock the row stays, so harvests that record it as sown still read back; it is just
    /// left out of the seed list and of the sowing picker.
    /// </summary>
    public bool IsDeleted { get; set; }
}
