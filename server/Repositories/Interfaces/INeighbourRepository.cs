using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>
/// The caller's neighbourhood. Every method is written from one user's point of view — the id of
/// the user asking is always the first argument, and what comes back describes the other party.
/// </summary>
public interface INeighbourRepository
{
    /// <summary>Accepted neighbours, nearest first for anyone whose farm location is pinned.</summary>
    Task<IEnumerable<NeighbourDto>> GetNeighboursAsync(int userId);

    /// <summary>Requests still waiting on an answer, in both directions — the ones this user has
    /// to respond to and the ones they are waiting on. Newest first.</summary>
    Task<IEnumerable<NeighbourDto>> GetRequestsAsync(int userId);

    /// <summary>Users matching a name, surname or email, each annotated with where the caller
    /// already stands with them. Excludes the caller. Capped, so a short term can't return the
    /// whole user table.</summary>
    Task<IEnumerable<NeighbourDto>> SearchAsync(int userId, string term, int limit = 20);

    /// <summary>
    /// Asks another user to be neighbours, and answers with the state that leaves the two in.
    /// Asking someone who has already asked you accepts their request instead of queueing a second
    /// one — which is also what settles two people asking each other at the same moment. Null when
    /// there is no such user.
    /// </summary>
    Task<NeighbourDto?> RequestAsync(int userId, int otherUserId);

    /// <summary>Accepts a request the caller received. Null when there is no such user, and
    /// unchanged when there is nothing from them to accept.</summary>
    Task<NeighbourDto?> AcceptAsync(int userId, int otherUserId);

    /// <summary>Drops the link between the two, whatever it was: removing a neighbour, declining a
    /// request and cancelling one the caller sent are all this. False when there was no link.</summary>
    Task<bool> RemoveAsync(int userId, int otherUserId);
}
