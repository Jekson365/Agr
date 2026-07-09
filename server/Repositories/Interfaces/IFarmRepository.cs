using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IFarmRepository
{
    Task<IEnumerable<Farm>> GetAllAsync();
    Task<Farm?> GetByIdAsync(int id);
    Task<Farm> AddAsync(Farm farm);
    Task<bool> UpdateAsync(Farm farm);
    Task<bool> DeleteAsync(int id);
}
