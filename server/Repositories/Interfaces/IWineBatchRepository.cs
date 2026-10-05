using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IWineBatchRepository
{
    Task<List<WineBatchSummary>> GetSummariesAsync(bool includeDeleted, int? id = null);
    Task<WineBatch?> GetByIdAsync(int id);
    Task<bool?> IsDeletedAsync(int id);
    Task<IEnumerable<WineStageChange>> GetStageChangesAsync(int wineBatchId);
    Task<WineBatch> AddAsync(WineBatch batch);
    Task<bool> UpdateAsync(WineBatch batch);
    Task<bool> HasRecordsAsync(int id);
    Task DeleteAsync(int id);
    Task SoftDeleteAsync(int id);
}
