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

    public async Task<FruitKind> AddAsync(string name)
    {
        var existing = await context.FruitKinds.FirstOrDefaultAsync(k => k.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            return existing;
        }

        var kind = new FruitKind { Name = name };
        context.FruitKinds.Add(kind);
        await context.SaveChangesAsync();
        return kind;
    }
}
