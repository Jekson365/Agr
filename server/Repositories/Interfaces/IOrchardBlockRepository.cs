using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IOrchardBlockRepository
{
    Task<IEnumerable<OrchardBlock>> GetAllAsync();
    Task<OrchardBlock?> GetByIdAsync(int id);
    Task<OrchardBlock?> GetByTreeStockAsync(int treeStockId);
    Task<OrchardBlock> AddAsync(OrchardBlock block);
    Task<bool> UpdateAsync(OrchardBlock block);
    Task<bool> DeleteAsync(int id);
}
