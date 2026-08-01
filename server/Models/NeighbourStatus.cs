namespace Server.Models;

/// <summary>How far along a <see cref="Neighbour"/> link is. A declined or cancelled request is
/// deleted rather than recorded, so there is no state for it here.</summary>
public enum NeighbourStatus
{
    /// <summary>Sent, waiting on the addressee.</summary>
    Pending,

    /// <summary>Accepted — the two are neighbours.</summary>
    Accepted,
}
