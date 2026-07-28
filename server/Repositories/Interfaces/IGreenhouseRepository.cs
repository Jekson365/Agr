using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseRepository
{
    Task<IEnumerable<Greenhouse>> GetAllAsync();
    Task<Greenhouse?> GetByIdAsync(int id);
    Task<Greenhouse> AddAsync(Greenhouse greenhouse);
    Task<bool> UpdateAsync(Greenhouse greenhouse);
    Task<bool> DeleteAsync(int id);
}
