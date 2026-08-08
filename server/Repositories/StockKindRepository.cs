using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class StockKindRepository(AppDbContext context) : IStockKindRepository
{
    public async Task<IEnumerable<StockKind>> GetAllAsync()
    {
        return await context.StockKinds.AsNoTracking().OrderBy(k => k.Id).ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        return await context.StockKinds.AnyAsync(k => k.Name.ToLower() == name.ToLower());
    }

    public async Task<StockKind> AddAsync(string name)
    {
        var existing = await context.StockKinds.FirstOrDefaultAsync(k => k.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            return existing;
        }

        var kind = new StockKind { Name = name };
        context.StockKinds.Add(kind);
        await context.SaveChangesAsync();
        return kind;
    }

    public async Task<DeleteStockKindResult> DeleteAsync(int id)
    {
        var existing = await context.StockKinds.FindAsync(id);
        if (existing is null)
        {
            return DeleteStockKindResult.NotFound;
        }

        // The seeded kinds are the catalog's floor: they are what a farm starts from, and every
        // client shows them without a delete. Checked here too, so the rule doesn't depend on
        // which client sent the request.
        if (BuiltInKinds.IsStock(existing.Name))
        {
            return DeleteStockKindResult.BuiltIn;
        }

        // Stock and seed both reference the crop by name (seed shares this catalog); deleting one
        // still in use would leave rows with a type no picker can show. Report it as a conflict
        // the client can explain.
        var inUse = await context.Stocks.AnyAsync(s => s.Type.ToLower() == existing.Name.ToLower())
            || await context.Seeds.AnyAsync(s => s.Type.ToLower() == existing.Name.ToLower());
        if (inUse)
        {
            return DeleteStockKindResult.InUse;
        }

        context.StockKinds.Remove(existing);
        await context.SaveChangesAsync();
        return DeleteStockKindResult.Deleted;
    }
}
