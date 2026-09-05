using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeSeedlingRepository
{
    Task<IEnumerable<TreeSeedling>> GetAllAsync();
    Task<TreeSeedling?> GetByIdAsync(int id);
    Task<TreeSeedling> AddAsync(TreeSeedling seedling);
    Task<bool> UpdateAsync(TreeSeedling seedling);
    Task<bool> DeleteAsync(int id);
    Task<TreeSeedling?> PlantOutAsync(int id, TreeSeedlingPlantOutRequest request);
}
