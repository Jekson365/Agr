using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockRepository
{
    /// <summary>
    /// The stocks the farm holds. Deleted ones are left out unless
    /// <paramref name="includeDeleted"/> asks for them, which only the pages that put a name to
    /// history already recorded against a stock (harvests, reports, land plots) need.
    /// </summary>
    Task<IEnumerable<Stock>> GetAllAsync(bool includeDeleted = false);

    /// <summary>Any stock, deleted or not — history pages look one up by the id they hold.</summary>
    Task<Stock?> GetByIdAsync(int id);

    Task<Stock> AddAsync(Stock stock);
    Task<bool> UpdateAsync(Stock stock);

    /// <summary>
    /// Marks the stock deleted instead of removing the row: everything recorded against it —
    /// harvest plans and results, its movement log, photos, feed rows — cascades on a real delete
    /// (see <see cref="Server.Data.AppDbContext"/>), and that history is worth keeping. Returns
    /// false when no stock with that id exists.
    /// </summary>
    Task<bool> SoftDeleteAsync(int id);

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
