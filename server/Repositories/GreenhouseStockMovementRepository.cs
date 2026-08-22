using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseStockMovementRepository(AppDbContext context) : IGreenhouseStockMovementRepository
{
    public async Task<IEnumerable<GreenhouseStockMovement>> GetAsync(int? greenhouseStockId = null)
    {
        var query = context.GreenhouseStockMovements.AsNoTracking().AsQueryable();
        if (greenhouseStockId is int id)
        {
            query = query.Where(m => m.GreenhouseStockId == id);
        }
        return await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
    }

    public async Task<GreenhouseStockMovement> AddAsync(GreenhouseStockMovement movement)
    {
        context.GreenhouseStockMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }
}
