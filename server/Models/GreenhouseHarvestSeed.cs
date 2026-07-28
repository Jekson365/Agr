namespace Server.Models;

/// <summary>
/// How much of a <see cref="GreenhouseSeed"/> was sown for a <see cref="GreenhouseHarvest"/> — the
/// input side, recorded while planning. The greenhouse counterpart to <see cref="HarvestSeed"/>.
/// Adding one deducts the amount from the seed; there is no movement ledger for greenhouse seed,
/// so unlike the field version this doesn't also log a history row.
/// </summary>
public class GreenhouseHarvestSeed
{
    public int Id { get; set; }
    public int GreenhouseHarvestId { get; set; }
    public int GreenhouseSeedId { get; set; }
    public decimal Amount { get; set; }
}
