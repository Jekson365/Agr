using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class PlantScanHistoryRepository(AppDbContext context) : IPlantScanHistoryRepository
{
    public async Task<IEnumerable<PlantScanHistory>> GetAllAsync()
    {
        return await context.PlantScanHistories
            .AsNoTracking()
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<PlantScanHistory> AddAsync(PlantScanHistory history)
    {
        context.PlantScanHistories.Add(history);
        await context.SaveChangesAsync();
        return history;
    }

    public async Task<PlantScanHistory?> DeleteAsync(int id)
    {
        var existing = await context.PlantScanHistories.FindAsync(id);
        if (existing is null)
        {
            return null;
        }

        context.PlantScanHistories.Remove(existing);
        await context.SaveChangesAsync();
        return existing;
    }
}
