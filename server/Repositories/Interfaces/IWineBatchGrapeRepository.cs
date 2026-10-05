using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IWineBatchGrapeRepository
{
    Task<IEnumerable<WineBatchGrape>> GetAsync(int? wineBatchId = null);
    Task<WineBatchGrape?> GetByIdAsync(int id);
    Task<bool> ExistsForBatchAsync(int wineBatchId, int treeProductId, int? excludeId = null);
    Task<TreeProductCategory?> GetProductCategoryAsync(int treeProductId);
    Task<decimal> GetAvailableAsync(int treeProductId, int? excludeGrapeId = null);
    Task<WineBatchGrape> AddAsync(WineBatchGrape grape, DateOnly date);
    Task<bool> UpdateAsync(WineBatchGrape grape);
    Task<bool> DeleteAsync(int id);
}
