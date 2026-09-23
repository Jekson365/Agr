using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeSpotTreatmentRepository
{
    Task<IEnumerable<TreeSpotTreatment>> GetAsync(int? treeStockId = null);
    Task<IEnumerable<TreeSpotTreatment>> AddRangeAsync(IEnumerable<TreeSpotTreatment> treatments);
    Task<bool> DeleteAsync(int id);
}
