using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeStockRepository
{
    Task<IEnumerable<TreeStock>> GetAllAsync();
    Task<TreeStock?> GetByIdAsync(int id);

    /// <summary>
    /// Whether another row already carries this custom label, ignoring case. Pass the row being
    /// edited as <paramref name="excludeId"/> so it doesn't collide with itself.
    /// </summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);

    /// <summary>
    /// Whether another row already yields this product. Pass the row being edited as
    /// <paramref name="excludeId"/> so it doesn't collide with itself.
    /// </summary>
    Task<bool> ExistsByTreeProductAsync(int treeProductId, int? excludeId = null);

    Task<TreeStock> AddAsync(TreeStock stock);
    Task<bool> UpdateAsync(TreeStock stock);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Adds <paramref name="delta"/> to the amount of the tree stock row identified by
    /// <paramref name="treeStockId"/> (a no-op if that row no longer exists). Does not log a
    /// <see cref="TreeStockMovement"/> itself — callers that need history manage their own record
    /// (see <see cref="Server.Repositories.HarvestResultRepository"/>).
    /// </summary>
    Task AdjustAmountRawAsync(int treeStockId, decimal delta);

    /// <summary>
    /// Adds <paramref name="delta"/> to the tree stock's amount and logs a
    /// <see cref="TreeStockMovement"/> tagged with <paramref name="source"/>. Returns the updated
    /// tree stock, or null if no row with that id exists.
    /// </summary>
    Task<TreeStock?> AdjustAmountAsync(int treeStockId, decimal delta, StockMovementSource source, int? marketListingId = null);
}
