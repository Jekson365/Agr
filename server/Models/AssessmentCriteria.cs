namespace Server.Models;

/// <summary>
/// What one quality band means for one good: the measures a pick has to meet to be graded into it.
/// Belongs to exactly one good (<see cref="StockId"/> for a plant-stock good,
/// <see cref="TreeStockId"/> for a fruit-tree one) and is set on that good's own page — a harvest
/// then only records how much came out at each band.
/// </summary>
public class AssessmentCriteria
{
    public int Id { get; set; }

    /// <summary>Set when the band belongs to a plant-stock good; null for a fruit-tree one.</summary>
    public int? StockId { get; set; }

    /// <summary>Set when the band belongs to a fruit-tree good; null for a plant-stock one.</summary>
    public int? TreeStockId { get; set; }

    public AssessmentGrade Grade { get; set; }

    /// <summary>Whether the farm sorts into this band at all. A band it stopped using is switched
    /// off rather than deleted: what it was defined as stays, the harvests already graded into it
    /// keep their figures, and turning it back on restores the standard as it was.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>The band's size range. Null at either end where it is not part of the standard —
    /// a band may be defined on weight alone, or open at one end ("6 and up").</summary>
    public decimal? SizeFrom { get; set; }
    public decimal? SizeTo { get; set; }

    /// <summary>The band's weight range, read the same way as the size one.</summary>
    public decimal? WeightFrom { get; set; }
    public decimal? WeightTo { get; set; }

    /// <summary>How much damage the band tolerates, 0–100.</summary>
    public decimal? Damaged { get; set; }

    /// <summary>How much rot the band tolerates, 0–100.</summary>
    public decimal? Rotten { get; set; }

    /// <summary>The moisture the band is held to, 0–100.</summary>
    public decimal? Moisture { get; set; }

    /// <summary>The colour the band is judged by, in the farm's own words. May be blank.</summary>
    public string Color { get; set; } = string.Empty;
}
