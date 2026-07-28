namespace Server.Models;

/// <summary>
/// Seed held for sowing in a <see cref="Greenhouse"/> — the input side of greenhouse growing, and
/// the counterpart to <see cref="Seed"/> for the field. Created alongside its
/// <see cref="GreenhouseStock"/>, so a greenhouse crop always arrives as both the seed sown and
/// the produce it becomes.
/// </summary>
public class GreenhouseSeed
{
    public int Id { get; set; }

    /// <summary>The greenhouse it is held for. Required.</summary>
    public int GreenhouseId { get; set; }

    /// <summary>A <see cref="StockKind"/> name — greenhouse seed and stock share the crop catalog.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional label telling apart seeds of the same crop, e.g. "Roma".</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public SeedUnit Unit { get; set; }
}
