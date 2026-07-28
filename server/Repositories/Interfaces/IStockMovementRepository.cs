using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockMovementRepository
{
    Task<IEnumerable<StockMovement>> GetByStockAsync(int stockId);
    Task<StockMovement?> GetByIdAsync(int id);
    Task<StockMovement> AddAsync(StockMovement movement);

    /// <summary>
    /// Removes a single movement by id. The caller is responsible for reversing its effect on
    /// the stock's amount (see <see cref="IStockRepository.AdjustAmountRawAsync"/>) so the
    /// remaining history still explains the balance.
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Updates the movement linked to <paramref name="harvestItemId"/> in place (rather than
    /// logging a new one), so editing a harvest item doesn't pile up duplicate history entries.
    /// Returns false if no movement is linked to that item yet.
    /// </summary>
    Task<bool> UpdateForHarvestItemAsync(int harvestItemId, int stockId, decimal delta);

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
    Task<bool> UpdateForHarvestResultAsync(int harvestResultId, int stockId, decimal delta);

    /// <summary>
    /// Removes the movement linked to <paramref name="harvestResultId"/>, if any — used when a
    /// harvest's stock contribution is reversed (e.g. its status moves off "Harvested").
    /// </summary>
    Task<bool> DeleteForHarvestResultAsync(int harvestResultId);
}
