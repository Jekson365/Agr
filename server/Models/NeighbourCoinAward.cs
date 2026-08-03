namespace Server.Models;

/// <summary>
/// A record that a pair of users have already been paid for becoming neighbours. It deliberately
/// outlives the <see cref="Neighbour"/> row itself, which unfriending deletes: falling out and
/// making up again is the same friendship, and only pays once.
///
/// The pair is stored lowest id first (see <see cref="Services.CoinService"/>), so one row covers
/// them whichever of the two did the asking.
/// </summary>
public class NeighbourCoinAward
{
    public int Id { get; set; }

    /// <summary>The lower of the two user ids.</summary>
    public int UserAId { get; set; }

    /// <summary>The higher of the two user ids.</summary>
    public int UserBId { get; set; }

    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
}
