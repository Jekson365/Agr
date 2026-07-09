namespace Server.Models;

/// <summary>
/// A single production event — e.g. a milking or egg-collection batch — with quantity, unit, and
/// optional pricing/collector details. Recorded either for one animal (<see cref="AnimalId"/> set,
/// a <see cref="LivestockDetail"/>) or for an entire group (<see cref="LivestockId"/> set, a
/// <see cref="Livestock"/>) — exactly one of the two must be set.
/// </summary>
public class AnimalProduction
{
    public int Id { get; set; }

    /// <summary>Set when this record is for a single animal; null for a whole-group record.</summary>
    public int? AnimalId { get; set; }

    /// <summary>Set when this record is for an entire livestock group; null for a single-animal record.</summary>
    public int? LivestockId { get; set; }

    /// <summary>How many animals this record covers: 1 for a single-animal record, or the number
    /// of animals in the group that contributed (usually the group's full count) for a group record.</summary>
    public int AnimalCount { get; set; } = 1;

    public int ProductionTypeId { get; set; }
    public DateTime CollectionDate { get; set; }
    public decimal Quantity { get; set; }
    public int UnitId { get; set; }
    public string? Quality { get; set; }
    public decimal? PricePerUnit { get; set; }
    public decimal? TotalPrice { get; set; }
    public string? CollectedBy { get; set; }
    public string? BatchNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
