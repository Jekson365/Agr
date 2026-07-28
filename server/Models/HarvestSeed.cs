namespace Server.Models;

/// <summary>
/// How much of a <see cref="Seed"/> was sown for a <see cref="Harvest"/> — the input side of the
/// harvest, recorded while planning, as opposed to <see cref="HarvestItem"/> (the yield expected
/// from it) and <see cref="HarvestResult"/> (what was actually picked). Adding one deducts the
/// amount from the seed and logs a <see cref="SeedMovement"/>.
/// </summary>
public class HarvestSeed
{
    public int Id { get; set; }
    public int HarvestId { get; set; }
    public int SeedId { get; set; }
    public decimal Amount { get; set; }
}
