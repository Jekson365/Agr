using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class ProductionTypeRepository(AppDbContext context) : IProductionTypeRepository
{
    public async Task<IEnumerable<ProductionType>> GetAllAsync()
    {
        return await context.ProductionTypes
            .AsNoTracking()
            .OrderBy(t => t.Id)
            .ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        return await context.ProductionTypes.AnyAsync(t => t.Name.ToLower() == name.ToLower());
    }

    public async Task<ProductionType> AddAsync(string name)
    {
        // Matching StockKindRepository: adding a name that already exists is a no-op returning the
        // existing row, so a double submit can't produce two "Milk" types.
        var existing = await context.ProductionTypes.FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            return existing;
        }

        var type = new ProductionType { Name = name };
        context.ProductionTypes.Add(type);
        await context.SaveChangesAsync();
        return type;
    }

    public async Task<DeleteProductionTypeResult> DeleteAsync(int id)
    {
        var existing = await context.ProductionTypes.FindAsync(id);
        if (existing is null)
        {
            return DeleteProductionTypeResult.NotFound;
        }

        // The FKs to ProductionType (from production records, movements, and the livestock groups
        // that declare it as what they produce or as their own meat) are Restrict, so deleting one
        // that is still referenced would throw at the database. Check first and report it as a
        // conflict the client can explain, rather than surfacing a 500.
        //
        // MeatProductionTypeId belongs in here alongside ProductionTypeId. A meat type is normally
        // one group's alone, but nothing stops two from pointing at the same row — a group renamed
        // to a name another group's meat already carries, or a type picked by hand — and the FK
        // would throw either way.
        var inUse = await context.AnimalProductions.AnyAsync(p => p.ProductionTypeId == id)
            || await context.ProductionMovements.AnyAsync(m => m.ProductionTypeId == id)
            || await context.Livestock.AnyAsync(l => l.ProductionTypeId == id || l.MeatProductionTypeId == id)
            || await context.LivestockProduces.AnyAsync(p => p.ProductionTypeId == id);
        if (inUse)
        {
            return DeleteProductionTypeResult.InUse;
        }

        context.ProductionTypes.Remove(existing);
        await context.SaveChangesAsync();
        return DeleteProductionTypeResult.Deleted;
    }
}
