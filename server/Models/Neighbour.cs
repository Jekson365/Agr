namespace Server.Models;

/// <summary>
/// A link between two users who farm near each other. It lives in the master database rather than
/// either party's own: a neighbourhood spans tenants, and neither side's database can hold a row
/// the other is allowed to answer.
///
/// One row covers the pair in both directions — who asked is <see cref="RequesterId"/>, who was
/// asked is <see cref="AddresseeId"/>, and that stays put once the request is accepted so the
/// history of who approached whom is not lost. Declining, cancelling and removing all delete the
/// row, which is also what lets either side ask again later.
/// </summary>
public class Neighbour
{
    public int Id { get; set; }

    /// <summary>The user who sent the request.</summary>
    public int RequesterId { get; set; }

    /// <summary>The user the request was sent to — the only one who may accept it.</summary>
    public int AddresseeId { get; set; }

    public NeighbourStatus Status { get; set; } = NeighbourStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the addressee accepted, or null while the request is still pending.</summary>
    public DateTime? AcceptedAt { get; set; }
}
