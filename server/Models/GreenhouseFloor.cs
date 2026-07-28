namespace Server.Models;

/// <summary>
/// One level of a <see cref="Greenhouse"/>'s layout — a greenhouse can have several, each with its
/// own set of <see cref="GreenhouseSection"/>s. Most greenhouses have exactly one; multiple floors
/// exist for the (rarer) multi-level structure.
/// </summary>
public class GreenhouseFloor
{
    public int Id { get; set; }
    public int GreenhouseId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Display order in the floor list/switcher — floors are added at the end by default.</summary>
    public int SortOrder { get; set; }
}
