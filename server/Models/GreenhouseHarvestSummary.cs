namespace Server.Models;

/// <summary>
/// A <see cref="GreenhouseHarvest"/> together with the yield it recorded — how a greenhouse's page
/// lists its harvests. Read as one call rather than a list followed by a results request per row,
/// which cost a request for every harvest on the page just to fill in what each one collected.
/// </summary>
public class GreenhouseHarvestSummary
{
    public required GreenhouseHarvest Harvest { get; set; }

    /// <summary>What the harvest recorded as picked. Empty for one that hasn't been harvested.</summary>
    public IEnumerable<GreenhouseHarvestResult> Results { get; set; } = [];
}
