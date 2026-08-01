namespace Server.Models;

public class Livestock
{
    public int Id { get; set; }

    /// <summary>A <see cref="LivestockKind"/> name — an open set of built-in defaults plus
    /// whatever custom kinds the user added, referenced by name like Stock.Type.</summary>
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FarmId { get; set; }

    /// <summary>
    /// What this group produces — the <see cref="ProductionType"/> every one of its
    /// <see cref="AnimalProduction"/> records is collected under. Declared on the group rather than
    /// chosen per record: a herd yields what it yields, and choosing again on each batch is how one
    /// group's history ends up split across unrelated outputs. Settled once set, since the records
    /// already collected are counted under it.
    ///
    /// Null only for a group that predates this and has collected nothing (one with records was
    /// given the type those records were collected under); such a group declares what it produces
    /// before its first record.
    /// </summary>
    public int? ProductionTypeId { get; set; }
}
