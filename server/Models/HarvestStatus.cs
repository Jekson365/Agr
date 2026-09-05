namespace Server.Models;

/// <summary>The lifecycle stage of a <see cref="Harvest"/>. Stock is only adjusted once a harvest
/// reaches <see cref="TransferredToBalance"/>: <see cref="Harvested"/> records what was picked,
/// and the step after it is what books that yield into the balances and the reports.</summary>
public enum HarvestStatus
{
    Planning,
    Planting,
    Emergence,
    Flowering,
    Ripening,
    HarvestReady,
    Harvested,
    TransferredToBalance,
}
