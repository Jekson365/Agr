using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockRepository
{
    Task<IEnumerable<Stock>> GetAllAsync();
    Task<Stock?> GetByIdAsync(int id);
    Task<Stock> AddAsync(Stock stock);
    Task<bool> UpdateAsync(Stock stock);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Adds <paramref name="delta"/> to the amount of the stock row identified by
    /// <paramref name="stockId"/> (a no-op if that stock no longer exists). Does not log a
    /// <see cref="StockMovement"/> itself — callers that need history manage their own record
    /// (see <see cref="Server.Repositories.HarvestItemRepository"/>, which keeps one movement
    /// per harvest item and updates it in place instead of logging a new one each edit).
    /// </summary>
    Task AdjustAmountRawAsync(int stockId, decimal delta);

    /// <summary>
    /// Adds <paramref name="delta"/> to the stock's amount and logs a <see cref="StockMovement"/>
    /// tagged with <paramref name="source"/>. Returns the updated stock, or null if no stock with
    /// that id exists.
    /// </summary>
    Task<Stock?> AdjustAmountAsync(int stockId, decimal delta, StockMovementSource source, int? marketListingId = null);
}
