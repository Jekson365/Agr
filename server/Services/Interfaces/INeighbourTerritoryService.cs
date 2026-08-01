using Server.Models;

namespace Server.Services.Interfaces;

/// <summary>
/// Reads the land other people have outlined within reach of a user — anyone's, neighbour or not,
/// so long as it is inside <see cref="NeighbourTerritoryService.RadiusKm"/> of theirs. Each
/// farmer's land lives in their own tenant database, so this is the one place that reaches across
/// tenants, and it takes nothing but the outlines and the name they go by.
/// </summary>
public interface INeighbourTerritoryService
{
    /// <summary>The outlines to draw — thin, because a map holds many of them at once.</summary>
    Task<IEnumerable<NeighbourTerritoryDto>> GetForUserAsync(int userId);

    /// <summary>
    /// One territory in full, for when a user picks it out: who farms it and what they grow there.
    /// Null when there is no such land, when it is the caller's own, or when it is outside the
    /// reach <see cref="GetForUserAsync"/> would have shown it within — a farm id is not a key to
    /// land the map never offered.
    /// </summary>
    Task<TerritoryDetailsDto?> GetDetailsAsync(int userId, int ownerId, int farmId);
}
