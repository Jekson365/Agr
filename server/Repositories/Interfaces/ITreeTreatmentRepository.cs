using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeTreatmentRepository
{
    Task<IEnumerable<TreeTreatment>> GetAsync(int? treeStockId = null);
    Task<TreeTreatment> AddAsync(TreeTreatment treatment);
    Task<bool> DeleteAsync(int id);
}
