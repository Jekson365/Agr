using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeStockRepository
{
    /// <summary>
    /// The fruit the farm holds. Deleted ones are left out unless <paramref name="includeDeleted"/>
    /// asks for them, which only the pages that put a name to history already recorded against an
    /// orchard need.
    /// </summary>
    Task<IEnumerable<TreeStock>> GetAllAsync(bool includeDeleted = false);

    /// <summary>Any fruit, deleted or not — history pages look one up by the id they hold.</summary>
    Task<TreeStock?> GetByIdAsync(int id);

    /// <summary>
    /// Whether another row still on the page carries this custom label, ignoring case. Pass the row
    /// being edited as <paramref name="excludeId"/> so it doesn't collide with itself. A removed
    /// fruit is listed nowhere, so it holds no claim on its label.
    /// </summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);

    /// <summary>
    /// Whether another row already yields this product, <em>including a removed one</em> — it keeps
    /// the product it yielded, since the harvests booked against that product read back through it.
    /// Pass the row being edited as <paramref name="excludeId"/> so it doesn't collide with itself.
    /// </summary>
    Task<bool> ExistsByTreeProductAsync(int treeProductId, int? excludeId = null);

    Task<TreeStock> AddAsync(TreeStock stock);
    Task<bool> UpdateAsync(TreeStock stock);

    /// <summary>
    /// Marks the fruit deleted instead of removing the row: its movement log, the harvest rows
    /// recording it as picked and its land plot all cascade on a real delete (see
    /// <see cref="Server.Data.AppDbContext"/>), and that history is worth keeping. Returns false
    /// when no fruit with that id exists.
    /// </summary>
    Task<bool> SoftDeleteAsync(int id);

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
