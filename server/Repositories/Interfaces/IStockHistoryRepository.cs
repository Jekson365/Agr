using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockHistoryRepository
{
    Task<IEnumerable<StockHistory>> GetByStockAsync(int stockId);
    Task<StockHistory> AddAsync(StockHistory history);
    Task<bool> DeleteAsync(int id);
}
