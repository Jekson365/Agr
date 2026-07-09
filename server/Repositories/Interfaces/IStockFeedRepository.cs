using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockFeedRepository
{
    Task<IEnumerable<StockFeed>> GetByLivestockAsync(int livestockId);
    Task<StockFeed> AddAsync(StockFeed feed);
    Task<bool> UpdateAsync(StockFeed feed);
    Task<bool> DeleteAsync(int id);
}
