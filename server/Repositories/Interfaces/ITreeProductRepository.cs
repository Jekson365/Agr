using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeProductRepository
{
    Task<IEnumerable<TreeProduct>> GetAllAsync();
    Task<TreeProduct?> GetByIdAsync(int id);
    Task<TreeProduct> AddAsync(TreeProduct product);
    Task<bool> UpdateAsync(TreeProduct product);
    Task<bool> DeleteAsync(int id);
}
