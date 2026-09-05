namespace Server.Models;

/// <summary>
/// The result of grading one good in one finished harvest: how much of it came out at a given
/// band. What the band means is the good's own standard (see <see cref="AssessmentCriteria"/>);
/// this only records the split. Belongs to exactly one good, and moves no balance — the harvest's
/// results already did that.
/// </summary>
public class HarvestAssessment
{
    public int Id { get; set; }
    public int HarvestId { get; set; }

    /// <summary>Set when the line grades a plant-stock good; null for a fruit-tree one.</summary>
    public int? StockId { get; set; }

    /// <summary>Set when the line grades a fruit-tree good; null for a plant-stock one.</summary>
    public int? TreeStockId { get; set; }

    public AssessmentGrade Grade { get; set; }

    /// <summary>How much of the pick came out at this band and is usable.</summary>
    public decimal Quantity { get; set; }

    /// <summary>How much came out at this band but is spoiled. Counted against the pick alongside
    /// <see cref="Quantity"/>, and never added to it.</summary>
    public decimal Wasted { get; set; }
}
