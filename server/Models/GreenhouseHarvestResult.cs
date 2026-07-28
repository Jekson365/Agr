namespace Server.Models;

/// <summary>
/// The final, actual yield of a <see cref="GreenhouseStock"/> good, recorded once a
/// <see cref="GreenhouseHarvest"/> is marked Harvested. Distinct from
/// <see cref="GreenhouseHarvestItem"/> (the planned items) — this is what actually adjusts stock,
/// and can only be written while the harvest is Harvested. The greenhouse counterpart to
/// <see cref="HarvestResult"/>.
/// </summary>
public class GreenhouseHarvestResult
{
    public int Id { get; set; }
    public int GreenhouseHarvestId { get; set; }
    public int GreenhouseStockId { get; set; }
    public decimal Amount { get; set; }
}
