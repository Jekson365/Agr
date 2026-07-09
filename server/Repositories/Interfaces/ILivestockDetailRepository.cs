using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockDetailRepository
{
    Task<IEnumerable<LivestockDetail>> GetByLivestockAsync(int livestockId);
    Task<LivestockDetail?> GetByIdAsync(int id);
    Task<LivestockDetail> AddAsync(LivestockDetail detail);
    Task<bool> UpdateAsync(LivestockDetail detail);
    Task<bool> DeleteAsync(int id);
}
