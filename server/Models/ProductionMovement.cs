namespace Server.Models;

public enum ProductionMovementSource
{
    Manual,

    /// <summary>The amount was sold via a marketplace listing (see <see cref="MarketListing"/>).</summary>
    Market,
}

/// <summary>
/// A single change to a livestock-production balance, tagged with what caused it. Production
/// collections (<see cref="AnimalProduction"/>) are append-only and always add; sales and other
/// deductions are logged here instead, keyed by production type and unit — the same pair the
/// balance itself is computed per, since a type collected in litres and pieces can't be summed.
///
/// The meat a realized animal was taken for is not one of these. It is an
/// <see cref="AnimalProduction"/> collection like any other and adds through its own row, so an
/// entry here beside it would count the same meat twice — see
/// <see cref="AnimalProduction.IsRealization"/>.
/// </summary>
public class ProductionMovement
{
    public int Id { get; set; }
    public int ProductionTypeId { get; set; }
    public int UnitId { get; set; }

    /// <summary>
    /// The marketplace listing this sale was recorded from, if any. Deliberately a plain id and
    /// not a foreign key: listings live in the shared master database while movements live in
    /// the tenant's own, so the databases can't reference each other. Rolling the sale back uses
    /// it to put the listing back the way it was.
    /// </summary>
    public int? MarketListingId { get; set; }

    /// <summary>Signed change to the balance — negative for a sale.</summary>
    public decimal Delta { get; set; }
    public ProductionMovementSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
