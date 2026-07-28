namespace Server.Models;

/// <summary>
/// How many trees of a <see cref="TreeStock"/> were picked for a <see cref="Harvest"/> — the
/// orchard side of the harvest's input, alongside <see cref="HarvestSeed"/> for sown crops.
/// Unlike seed, picking doesn't consume anything: the trees are still standing afterwards, so
/// this records what was picked without moving the tree count. The fruit that came off them is
/// recorded as a <see cref="HarvestResult"/> against a plant <see cref="Stock"/>, by weight.
/// </summary>
public class HarvestTree
{
    public int Id { get; set; }
    public int HarvestId { get; set; }
    public int TreeStockId { get; set; }

    /// <summary>Number of trees picked, in the same unit the orchard is counted in ("ძირი").</summary>
    public decimal Amount { get; set; }

    /// <summary>How much produce came off those trees, recorded alongside the picking. Measured in
    /// the tree stock's assigned <see cref="TreeProduct"/> unit. Folds into the harvest's yield.</summary>
    public decimal HarvestedAmount { get; set; }
}
