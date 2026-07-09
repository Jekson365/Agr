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
}
