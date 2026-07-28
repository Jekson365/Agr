namespace Server.Models;

/// <summary>
/// Creating greenhouse stock together with the greenhouse seed for the same crop. Made in one call
/// so the pairing is enforced here rather than trusted to the client: stock created on its own,
/// followed by a seed request that never arrives, would leave a crop you can hold but never sow.
/// </summary>
public class GreenhouseStockWithSeedRequest
{
    public int GreenhouseId { get; set; }

    /// <summary>A <see cref="StockKind"/> name — the crop, shared by the stock and its seed.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional label, applied to both rows so they read identically.</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public StockUnit Unit { get; set; }

    public decimal SeedAmount { get; set; }
    public SeedUnit SeedUnit { get; set; }
}

/// <summary>Both rows a <see cref="GreenhouseStockWithSeedRequest"/> creates.</summary>
public class GreenhouseStockWithSeedResponse
{
    public GreenhouseStock Stock { get; set; } = new();
    public GreenhouseSeed Seed { get; set; } = new();
}
