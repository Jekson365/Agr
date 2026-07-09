using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestItemRepository
{
    Task<IEnumerable<HarvestItem>> GetByHarvestAsync(int harvestId);
    Task<HarvestItem> AddAsync(HarvestItem item);
    Task<bool> UpdateAsync(HarvestItem item);
    Task<bool> DeleteAsync(int id);
}
