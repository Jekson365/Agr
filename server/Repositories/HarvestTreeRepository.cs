using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>Picking trees changes no balance — see <see cref="HarvestTree"/> — so this is plain
/// CRUD, with none of the movement bookkeeping <see cref="HarvestSeedRepository"/> needs.</summary>
public class HarvestTreeRepository(AppDbContext context) : IHarvestTreeRepository
{
    public async Task<IEnumerable<HarvestTree>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestTrees
            .AsNoTracking()
            .Where(h => h.HarvestId == harvestId)
            .OrderBy(h => h.Id)
            .ToListAsync();
    }

    public async Task<HarvestTree> AddAsync(HarvestTree harvestTree)
    {
        context.HarvestTrees.Add(harvestTree);
        await context.SaveChangesAsync();
        return harvestTree;
    }

    public async Task<bool> UpdateAsync(HarvestTree harvestTree)
    {
        var existing = await context.HarvestTrees.FindAsync(harvestTree.Id);
        if (existing is null)
        {
            return false;
        }

        existing.TreeStockId = harvestTree.TreeStockId;
        existing.Amount = harvestTree.Amount;
        existing.HarvestedAmount = harvestTree.HarvestedAmount;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestTrees.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.HarvestTrees.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForTreeStockAsync(int treeStockId)
    {
        return await context.HarvestTrees.AnyAsync(h => h.TreeStockId == treeStockId);
    }
}
