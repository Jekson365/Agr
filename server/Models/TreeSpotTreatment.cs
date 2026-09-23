namespace Server.Models;

/// <summary>
/// A treatment given to particular trees rather than to the whole orchard, which is what
/// <see cref="TreeTreatment"/> records. One row per tree: a single application over twenty trees is
/// twenty rows, so asking what any one tree has had stays a plain filter rather than a join.
/// </summary>
public class TreeSpotTreatment
{
    public int Id { get; set; }

    public int TreeStockId { get; set; }

    /// <summary>
    /// Which tree of the orchard's planting plan, in the order the plan lays them out. The plan is
    /// computed from the block's outline and spacings rather than stored, so this names the same
    /// tree only while those are unchanged — <see cref="Latitude"/> and <see cref="Longitude"/> are
    /// what still say where the treated tree stood once a block is laid out again.
    /// </summary>
    public int TreeIndex { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public DateOnly Date { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
