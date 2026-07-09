using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestResultRepository
{
    Task<IEnumerable<HarvestResult>> GetByHarvestAsync(int harvestId);
    Task<HarvestResult> AddAsync(HarvestResult result);
    Task<bool> UpdateAsync(HarvestResult result);
    Task<bool> DeleteAsync(int id);
}
