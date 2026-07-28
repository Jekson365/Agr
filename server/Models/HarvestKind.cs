namespace Server.Models;

/// <summary>
/// What a <see cref="Harvest"/> is harvesting. The two are recorded differently: a crop harvest
/// consumes seed that was sown (<see cref="HarvestSeed"/>), while a fruit harvest picks standing
/// trees (<see cref="HarvestTree"/>) without consuming them. Both yield produce by weight into
/// plant <see cref="Stock"/>.
/// </summary>
public enum HarvestKind
{
    Crop,
    Fruit,
}
