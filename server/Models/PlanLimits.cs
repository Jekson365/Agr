namespace Server.Models;

/// <summary>Per-<see cref="StoragePlan"/> caps on farm resources, and which features are gated.</summary>
public static class PlanLimits
{
    /// <summary>Max number of land/farm properties, or null when unlimited.</summary>
    public static int? MaxLand(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => 1,
        StoragePlan.Medium => 3,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };

    /// <summary>Max number of livestock groups/kinds, or null when unlimited.</summary>
    public static int? MaxLivestockKinds(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => 3,
        StoragePlan.Medium => 10,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };

    /// <summary>Max number of stock kinds, or null when unlimited.</summary>
    public static int? MaxStockKinds(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => 3,
        StoragePlan.Medium => 10,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };

    /// <summary>Max number of fruit/tree stock kinds, or null when unlimited.</summary>
    public static int? MaxFruitKinds(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => 3,
        StoragePlan.Medium => 10,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };

    /// <summary>Max AI plant scans per day, or null when unlimited.</summary>
    public static int? MaxScansPerDay(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => 1,
        StoragePlan.Medium => 5,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };

    /// <summary>The balance report is part of every plan, including Free — the gate stays here as
    /// the single seam to re-restrict it from.</summary>
    public static bool BalanceAllowed(StoragePlan plan) => true;

    public static bool EquipmentAllowed(StoragePlan plan) => plan != StoragePlan.Free;
}
