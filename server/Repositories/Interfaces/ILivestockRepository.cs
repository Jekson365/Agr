using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockRepository
{
    Task<IEnumerable<Livestock>> GetAllAsync();
    Task<Livestock?> GetByIdAsync(int id);
    Task<Livestock> AddAsync(Livestock livestock);
    Task<bool> UpdateAsync(Livestock livestock);
    Task<bool> DeleteAsync(int id);
}
