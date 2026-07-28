namespace Server.Models;

/// <summary>
/// Records that a <see cref="GreenhouseStock"/> kind is planted in a <see cref="GreenhouseSection"/>.
/// Many-to-many and otherwise empty — a section can hold several kinds, and a kind can be planted
/// in several sections. Purely descriptive: it doesn't move any stock amount, unlike a harvest
/// result.
/// </summary>
public class GreenhouseSectionStock
{
    public int Id { get; set; }
    public int GreenhouseSectionId { get; set; }
    public int GreenhouseStockId { get; set; }
}
