namespace Server.Models;

/// <summary>
/// A good held in a <see cref="Greenhouse"/>. Its own table rather than a flag on
/// <see cref="Stock"/>: covered growing is tracked separately from the field, so the two lists,
/// their seeds and their harvests never mix. Measured in the same <see cref="StockUnit"/>s and
/// typed by the same <see cref="StockKind"/> catalog, so the crops read identically in both.
/// </summary>
public class GreenhouseStock
{
    public int Id { get; set; }

    /// <summary>The greenhouse holding it. Required — this is what it belongs to.</summary>
    public int GreenhouseId { get; set; }

    /// <summary>A <see cref="StockKind"/> name. Not a foreign key, matching <see cref="Stock.Type"/>.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional label telling apart goods that share a type.</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public StockUnit Unit { get; set; }
}
