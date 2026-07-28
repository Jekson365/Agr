namespace Server.Models;

/// <summary>
/// A harvest taken from a <see cref="Greenhouse"/>. Kept in its own table rather than as another
/// <see cref="HarvestKind"/>: a greenhouse harvest belongs to a greenhouse instead of a farm or a
/// land plot, and it records no sown seed or picked trees of its own, so it shares none of the
/// item/result/tree machinery that hangs off <see cref="Harvest"/>.
/// </summary>
public class GreenhouseHarvest
{
    public int Id { get; set; }

    /// <summary>The greenhouse it was taken from. Required — this is what it belongs to.</summary>
    public int GreenhouseId { get; set; }

    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public HarvestStatus Status { get; set; } = HarvestStatus.Planning;

    /// <summary>When the crop is expected to be picked, set while planning. Optional.</summary>
    public DateOnly? ExpectedHarvestDate { get; set; }

    // Expense breakdown and revenue, entered once the harvest is complete. All optional.
    public decimal? EquipmentCost { get; set; }
    public decimal? WorkersCost { get; set; }
    public decimal? FuelCost { get; set; }
    public decimal? OtherCost { get; set; }
    public decimal? Revenue { get; set; }
}
