namespace Server.Models;

/// <summary>A recorded harvest event — a title and date under which stock items are logged.</summary>
public class Harvest
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public HarvestStatus Status { get; set; } = HarvestStatus.Planning;

    /// <summary>Crop or fruit — decides which input the harvest records and which list it
    /// belongs to. Defaults to <see cref="HarvestKind.Crop"/>, so harvests created before the
    /// split keep showing where they always did.</summary>
    public HarvestKind Kind { get; set; } = HarvestKind.Crop;

    /// <summary>
    /// When the crop is expected to be picked, set while planning. Optional — a harvest logged
    /// after the fact never needs one. Distinct from <see cref="Date"/>, which is the harvest's
    /// own record date and the one reporting groups by; this is the plan the record is measured
    /// against, so a non-Harvested harvest whose expected date has passed is overdue.
    /// </summary>
    public DateOnly? ExpectedHarvestDate { get; set; }

    /// <summary>The farm/land this harvest belongs to.</summary>
    public int? FarmId { get; set; }

    /// <summary>An optional, more specific plot within <see cref="FarmId"/>.</summary>
    public int? LandPlotId { get; set; }

    // Expense breakdown, entered once the harvest is complete. All optional/nullable — a harvest
    // isn't required to have costs recorded against it.
    public decimal? EquipmentCost { get; set; }
    public decimal? WorkersCost { get; set; }
    public decimal? FuelCost { get; set; }
    public decimal? OtherCost { get; set; }

    /// <summary>Revenue earned from this harvest's yield, entered alongside the expense breakdown.</summary>
    public decimal? Revenue { get; set; }
}
