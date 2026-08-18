using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class FruitKindRepository(AppDbContext context) : IFruitKindRepository
{
    public async Task<IEnumerable<FruitKind>> GetAllAsync()
    {
        return await context.FruitKinds.AsNoTracking().OrderBy(k => k.Id).ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        return await context.FruitKinds.AnyAsync(k => k.Name.ToLower() == name.ToLower());
    }

    public async Task<FruitKind> AddAsync(string name, string imagePath)
    {
        var existing = await context.FruitKinds.FirstOrDefaultAsync(k => k.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            return existing;
        }

        var kind = new FruitKind { Name = name, ImagePath = imagePath };
        context.FruitKinds.Add(kind);
        await context.SaveChangesAsync();
        return kind;
    }

    public async Task<DeleteFruitKindResult> DeleteAsync(int id)
    {
        var existing = await context.FruitKinds.FindAsync(id);
        if (existing is null)
        {
            return DeleteFruitKindResult.NotFound;
        }

        // Seeded kinds are the catalog's floor — see StockKindRepository.DeleteAsync.
        if (BuiltInKinds.IsFruit(existing.Name))
        {
            return DeleteFruitKindResult.BuiltIn;
        }

        // Tree stock references the kind by name; deleting one that is still in use would leave
        // rows with a type no picker can show. Report it as a conflict the client can explain.
        var inUse = await context.TreeStocks.AnyAsync(s => s.Type.ToLower() == existing.Name.ToLower());
        if (inUse)
        {
            return DeleteFruitKindResult.InUse;
        }

        context.FruitKinds.Remove(existing);
        await context.SaveChangesAsync();
        return DeleteFruitKindResult.Deleted;
    }
}
