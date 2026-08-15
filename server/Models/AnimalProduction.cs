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
    /// of animals in the group that contributed (usually the group's full count) for a group
    /// record. Always 1 for a realization, which is one animal's — see <see cref="IsRealization"/>.</summary>
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
    /// A realization: the animal this record covers was slaughtered and its meat taken off it. One
    /// animal per record — a herd is realized by recording each of its animals as it goes, never
    /// as a single entry standing for all of them (<see cref="AnimalCount"/> is 1; rows naming
    /// more are from when it could).
    ///
    /// An ordinary production record in every other respect — same fields, same save path. The
    /// group's <see cref="Livestock.Count"/> is deliberately left alone: the herd is not taken
    /// apart to say what became of it. Recorded under the group's own meat type, not the type it
    /// declares it produces, so a herd that yields milk can still be realized without its milk
    /// history changing meaning.
    /// </summary>
    public bool IsRealization { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
