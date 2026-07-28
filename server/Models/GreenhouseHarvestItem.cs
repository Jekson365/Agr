namespace Server.Models;

/// <summary>
/// How much of a <see cref="GreenhouseStock"/> good is planned for a <see cref="GreenhouseHarvest"/>.
/// The greenhouse counterpart to <see cref="HarvestItem"/> — always points at greenhouse stock,
/// since a greenhouse has no orchard equivalent to pick from.
/// </summary>
public class GreenhouseHarvestItem
{
    public int Id { get; set; }
    public int GreenhouseHarvestId { get; set; }
    public int GreenhouseStockId { get; set; }
    public decimal Amount { get; set; }

    /// <summary>
    /// The unit <see cref="Amount"/> is planned in. A plan may use a different unit than the good
    /// is stocked in, so it is stored per row rather than read off the target. Left blank by a
    /// client, it falls back to the target's own unit — see GreenhouseHarvestItemRepository.
    /// </summary>
    public string Unit { get; set; } = string.Empty;
}
