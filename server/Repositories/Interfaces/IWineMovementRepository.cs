using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IWineMovementRepository
{
    Task<IEnumerable<WineMovement>> GetAsync(int? wineBatchId = null);
    Task<WineMovement?> GetByIdAsync(int id);
    Task<(decimal Liters, int Bottles)> GetBalanceAsync(int wineBatchId, int? excludeId = null);
    Task<int> GetBottlesLeftAsync(int wineBottlingId, int? excludeId = null);
    Task<WineMovement?> GetProductionAsync(int wineBatchId);
    Task<bool> HasOnlyProductionAsync(int wineBatchId);
    Task<WineMovement> AddAsync(WineMovement movement);
    Task UpdateAsync(WineMovement movement);
    Task<bool> DeleteAsync(int id);
}
