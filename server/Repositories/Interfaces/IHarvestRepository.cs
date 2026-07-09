using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestRepository
{
    Task<IEnumerable<Harvest>> GetAllAsync();
    Task<Harvest?> GetByIdAsync(int id);
    Task<Harvest> AddAsync(Harvest harvest);
    Task<bool> UpdateAsync(Harvest harvest);
    Task<bool> DeleteAsync(int id);
}
