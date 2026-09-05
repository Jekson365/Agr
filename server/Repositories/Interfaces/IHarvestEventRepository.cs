using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestEventRepository
{
    Task<IEnumerable<HarvestEvent>> GetAsync(int? harvestId = null);
    Task<HarvestEvent> AddAsync(HarvestEvent harvestEvent);
    Task<bool> UpdateAsync(HarvestEvent harvestEvent);
    Task<bool> DeleteAsync(int id);
}
