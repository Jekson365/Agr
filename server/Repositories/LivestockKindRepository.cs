using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockKindRepository(AppDbContext context) : ILivestockKindRepository
{
    public async Task<IEnumerable<LivestockKind>> GetAllAsync()
    {
        return await context.LivestockKinds.AsNoTracking().OrderBy(k => k.Id).ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        return await context.LivestockKinds.AnyAsync(k => k.Name.ToLower() == name.ToLower());
    }

    public async Task<LivestockKind> AddAsync(string name)
    {
        // Matching StockKindRepository: adding a name that already exists is a no-op returning
        // the existing row, so a double submit can't produce two "Cow" kinds.
        var existing = await context.LivestockKinds.FirstOrDefaultAsync(k => k.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            return existing;
        }

        var kind = new LivestockKind { Name = name };
        context.LivestockKinds.Add(kind);
        await context.SaveChangesAsync();
        return kind;
    }

    public async Task<DeleteLivestockKindResult> DeleteAsync(int id)
    {
        var existing = await context.LivestockKinds.FindAsync(id);
        if (existing is null)
        {
            return DeleteLivestockKindResult.NotFound;
        }

        // Seeded kinds are the catalog's floor — see StockKindRepository.DeleteAsync.
        if (BuiltInKinds.IsLivestock(existing.Name))
        {
            return DeleteLivestockKindResult.BuiltIn;
        }

        // Livestock references the kind by name; deleting one that is still in use would leave
        // groups with a type no picker can show. Report it as a conflict the client can explain.
        var inUse = await context.Livestock.AnyAsync(l => l.Type.ToLower() == existing.Name.ToLower());
        if (inUse)
        {
            return DeleteLivestockKindResult.InUse;
        }

        context.LivestockKinds.Remove(existing);
        await context.SaveChangesAsync();
        return DeleteLivestockKindResult.Deleted;
    }
}
