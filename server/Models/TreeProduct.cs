namespace Server.Models;

public enum TreeProductUnit
{
    Kilogram,
    Box,
    Quantity,
}

/// <summary>
/// A kind of produce a fruit tree yields — e.g. "ვაშლი", measured in kilograms. A standalone
/// catalog (managed on the Products tab): a <see cref="TreeStock"/> is assigned one it produces,
/// and a fruit <see cref="Harvest"/> records amounts against it (see <see cref="HarvestProduct"/>).
/// </summary>
public class TreeProduct
{
    public int Id { get; set; }

    /// <summary>What the trees produce.</summary>
    public string Name { get; set; } = string.Empty;

    public TreeProductUnit Unit { get; set; }
}
