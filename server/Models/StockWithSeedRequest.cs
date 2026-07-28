namespace Server.Models;

/// <summary>
/// Creating a stock together with the seed for the same crop. The two are made in one call so the
/// pairing can be enforced here rather than trusted to the client: a stock created on its own,
/// followed by a seed request that never arrives, would leave a crop you can hold but never sow.
/// </summary>
public class StockWithSeedRequest
{
    /// <summary>A <see cref="StockKind"/> name — the crop, shared by the stock and its seed.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional label, applied to both rows so they read identically.</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public StockUnit Unit { get; set; }

    public decimal SeedAmount { get; set; }
    public SeedUnit SeedUnit { get; set; }
}

/// <summary>Both rows a <see cref="StockWithSeedRequest"/> creates.</summary>
public class StockWithSeedResponse
{
    public Stock Stock { get; set; } = new();
    public Seed Seed { get; set; } = new();
}
