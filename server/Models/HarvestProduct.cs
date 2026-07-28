namespace Server.Models;

/// <summary>
/// How much of a <see cref="TreeProduct"/> a fruit <see cref="Harvest"/> actually yielded — the
/// orchard's answer to <see cref="HarvestResult"/>. Kept separate because fruit produce accrues
/// against the tree's own product rather than into plant <see cref="Stock"/>.
/// </summary>
public class HarvestProduct
{
    public int Id { get; set; }
    public int HarvestId { get; set; }
    public int TreeProductId { get; set; }
    public decimal Amount { get; set; }
}
