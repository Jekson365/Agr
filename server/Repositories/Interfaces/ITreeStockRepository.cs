using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeStockRepository
{
    Task<IEnumerable<TreeStock>> GetAllAsync();
    Task<TreeStock?> GetByIdAsync(int id);
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
}
