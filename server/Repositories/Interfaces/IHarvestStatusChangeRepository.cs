using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestStatusChangeRepository
{
    Task<IEnumerable<HarvestStatusChange>> GetAsync(int? harvestId = null);
    Task<bool> UpdateAsync(HarvestStatusChange change);
}
