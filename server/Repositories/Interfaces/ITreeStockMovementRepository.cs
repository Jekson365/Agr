using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeStockMovementRepository
{
    Task<IEnumerable<TreeStockMovement>> GetByTreeStockAsync(int treeStockId);
    Task<TreeStockMovement> AddAsync(TreeStockMovement movement);

    /// <summary>
    /// Updates the movement linked to <paramref name="harvestItemId"/> in place (rather than
    /// logging a new one), so editing a harvest item doesn't pile up duplicate history entries.
    /// Returns false if no movement is linked to that item yet.
    /// </summary>
    Task<bool> UpdateForHarvestItemAsync(int harvestItemId, int treeStockId, decimal delta);

    /// <summary>
    /// Removes the movement linked to <paramref name="harvestItemId"/>, if any — used when a
    /// harvest's stock contribution is reversed (e.g. its status moves off "Harvested").
    /// </summary>
    Task<bool> DeleteForHarvestItemAsync(int harvestItemId);

    /// <summary>
    /// Updates the movement linked to <paramref name="harvestResultId"/> in place (rather than
    /// logging a new one), so editing a harvest result doesn't pile up duplicate history entries.
    /// Returns false if no movement is linked to that result yet.
    /// </summary>
    Task<bool> UpdateForHarvestResultAsync(int harvestResultId, int treeStockId, decimal delta);

    /// <summary>
    /// Removes the movement linked to <paramref name="harvestResultId"/>, if any — used when a
    /// harvest's stock contribution is reversed (e.g. its status moves off "Harvested").
    /// </summary>
    Task<bool> DeleteForHarvestResultAsync(int harvestResultId);
}
