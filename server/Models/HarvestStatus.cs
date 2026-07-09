namespace Server.Models;

/// <summary>The lifecycle stage of a <see cref="Harvest"/>. Stock is only adjusted once a harvest
/// reaches <see cref="Harvested"/>.</summary>
public enum HarvestStatus
{
    Planning,
    Planting,
    Harvested,
}
