using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestItemRepository
{
    Task<IEnumerable<HarvestItem>> GetAsync(int? harvestId = null);
    Task<bool> ExistsForHarvestAsync(int harvestId);
    Task<HarvestItem> AddAsync(HarvestItem item);
    Task<bool> UpdateAsync(HarvestItem item);
    Task<bool> DeleteAsync(int id);
}
