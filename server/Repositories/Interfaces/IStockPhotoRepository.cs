using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockPhotoRepository
{
    Task<IEnumerable<StockPhoto>> GetByStockAsync(int stockId);
    Task<StockPhoto> AddAsync(StockPhoto photo);

    /// <summary>Deletes the photo and returns it (for cleanup of its uploaded image), or null if not found.</summary>
    Task<StockPhoto?> DeleteAsync(int id);
}
