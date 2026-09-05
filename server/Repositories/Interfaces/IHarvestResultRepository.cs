using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestResultRepository
{
    Task<IEnumerable<HarvestResult>> GetAsync(int? harvestId = null);
    Task<HarvestResult?> GetByIdAsync(int id);
    Task<bool> ExistsForHarvestAsync(int harvestId);
    Task<HarvestResult> AddAsync(HarvestResult result);
    Task<bool> UpdateAsync(HarvestResult result);
    Task<bool> DeleteAsync(int id);
}
