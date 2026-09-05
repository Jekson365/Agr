using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class OrchardBlockRepository(AppDbContext context) : IOrchardBlockRepository
{
    public async Task<IEnumerable<OrchardBlock>> GetAllAsync()
    {
        return await context.OrchardBlocks.AsNoTracking().OrderBy(b => b.Id).ToListAsync();
    }

    public async Task<OrchardBlock?> GetByIdAsync(int id)
    {
        return await context.OrchardBlocks.FindAsync(id);
    }

    public async Task<OrchardBlock?> GetByTreeStockAsync(int treeStockId)
    {
        return await context.OrchardBlocks.AsNoTracking().FirstOrDefaultAsync(b => b.TreeStockId == treeStockId);
    }

    public async Task<OrchardBlock> AddAsync(OrchardBlock block)
    {
        context.OrchardBlocks.Add(block);
        await context.SaveChangesAsync();
        return block;
    }

    public async Task<bool> UpdateAsync(OrchardBlock block)
    {
        var existing = await context.OrchardBlocks.FindAsync(block.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Boundary = block.Boundary;
        existing.Pattern = block.Pattern;
        existing.TreeSpacing = block.TreeSpacing;
        existing.RowSpacing = block.RowSpacing;
        existing.Rotation = block.Rotation;
        existing.TreeCount = block.TreeCount;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.OrchardBlocks.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.OrchardBlocks.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
