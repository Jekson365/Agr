using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockPhotoRepository(AppDbContext context) : IStockPhotoRepository
{
    public async Task<IEnumerable<StockPhoto>> GetByStockAsync(int stockId)
    {
        return await context.StockPhotos
            .AsNoTracking()
            .Where(p => p.StockId == stockId)
            .OrderByDescending(p => p.TakenAt)
            .ToListAsync();
    }

    public async Task<StockPhoto> AddAsync(StockPhoto photo)
    {
        context.StockPhotos.Add(photo);
        await context.SaveChangesAsync();
        return photo;
    }

    public async Task<StockPhoto?> DeleteAsync(int id)
    {
        var existing = await context.StockPhotos.FindAsync(id);
        if (existing is null)
        {
            return null;
        }

        context.StockPhotos.Remove(existing);
        await context.SaveChangesAsync();
        return existing;
    }
}
