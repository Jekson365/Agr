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

    /// <summary>
    /// A realization: the animals this record covers were slaughtered and their meat taken off
    /// them. It is an ordinary production record in every other respect — same fields, same save
    /// path — but the group's <see cref="Livestock.Count"/> moves with it, falling by
    /// <see cref="AnimalCount"/> when one is saved and rising again when it is removed. Recorded
    /// under the group's own meat type, not the type it declares it produces, so a herd that
    /// yields milk can still be realized without its milk history changing meaning.
    /// </summary>
    public bool IsRealization { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
