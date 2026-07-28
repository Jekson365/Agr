using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class ProductionMovementRepository(AppDbContext context) : IProductionMovementRepository
{
    public async Task<IEnumerable<ProductionMovement>> GetAllAsync()
    {
        return await context.ProductionMovements
            .AsNoTracking()
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<decimal> GetBalanceAsync(int productionTypeId, int unitId)
    {
        var collected = await context.AnimalProductions
            .Where(p => p.ProductionTypeId == productionTypeId && p.UnitId == unitId)
            .SumAsync(p => (decimal?)p.Quantity) ?? 0m;

        var movements = await context.ProductionMovements
            .Where(m => m.ProductionTypeId == productionTypeId && m.UnitId == unitId)
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;

        return collected + movements;
    }

    public async Task<ProductionMovement> AddAsync(ProductionMovement movement)
    {
        context.ProductionMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<ProductionMovement?> DeleteAsync(int id)
    {
        var existing = await context.ProductionMovements.FindAsync(id);
        if (existing is null)
        {
            return null;
        }

        // The balance is the sum of collections and movements, so dropping the row is all it
        // takes to give the quantity back — there is no stored total to correct.
        context.ProductionMovements.Remove(existing);
        await context.SaveChangesAsync();
        return existing;
    }
}
