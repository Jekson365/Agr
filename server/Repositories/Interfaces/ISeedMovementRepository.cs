using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ISeedMovementRepository
{
    Task<IEnumerable<SeedMovement>> GetBySeedAsync(int seedId);
    Task<SeedMovement> AddAsync(SeedMovement movement);

    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Updates the movement linked to <paramref name="harvestSeedId"/> in place rather than
    /// logging a new one, so editing how much seed a harvest used doesn't pile up duplicate
    /// history. Returns false when no movement is linked to that row yet.
    /// </summary>
    Task<bool> UpdateForHarvestSeedAsync(int harvestSeedId, int seedId, decimal delta);

    /// <summary>Removes the movement linked to <paramref name="harvestSeedId"/>, if any.</summary>
    Task<bool> DeleteForHarvestSeedAsync(int harvestSeedId);
}
