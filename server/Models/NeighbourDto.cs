namespace Server.Models;

/// <summary>
/// Another user as the caller sees them: their public profile, where the two of them stand with
/// each other, and how far away they farm. This is the shape every neighbours endpoint answers
/// with — the caller's own side of the link is implied, so it is never sent back.
/// </summary>
public class NeighbourDto
{
    /// <summary>The other user's id — what every action on this row is addressed to.</summary>
    public int UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    /// <summary>Only filled in for accepted neighbours — a stranger turned up by a search has not
    /// agreed to hand their phone number to whoever typed their name.</summary>
    public string PhoneNumber { get; set; } = string.Empty;

    public NeighbourState State { get; set; }

    /// <summary>Kilometres between the two pinned farm locations, when both have pinned one.</summary>
    public double? DistanceKm { get; set; }

    /// <summary>When the request was sent, or null if there is no link between the two.</summary>
    public DateTime? RequestedAt { get; set; }

    /// <summary>When they became neighbours, or null if they are not.</summary>
    public DateTime? AcceptedAt { get; set; }

    public static NeighbourDto From(User user, NeighbourState state, double? distanceKm, Neighbour? link) => new()
    {
        UserId = user.Id,
        Name = user.Name,
        Surname = user.Surname,
        Email = user.Email,
        ImagePath = user.ImagePath,
        City = user.City,
        Country = user.Country,
        PhoneNumber = state == NeighbourState.Neighbour ? user.PhoneNumber : string.Empty,
        State = state,
        DistanceKm = distanceKm,
        RequestedAt = link?.CreatedAt,
        AcceptedAt = link?.AcceptedAt,
    };
}

/// <summary>
/// Where the caller stands with another user. Unlike <see cref="NeighbourStatus"/>, which records
/// the link itself, this is told from the caller's side — a pending request is a different thing
/// to the person who sent it and the person who has to answer it.
/// </summary>
public enum NeighbourState
{
    /// <summary>No link between the two.</summary>
    None,

    /// <summary>Accepted, in whichever direction it was originally asked.</summary>
    Neighbour,

    /// <summary>The caller asked and is waiting for an answer.</summary>
    RequestSent,

    /// <summary>The other user asked; the caller is the one who can accept.</summary>
    RequestReceived,
}
