using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>
/// Picking trees takes nothing off the orchard — see <see cref="HarvestTree"/> — but the fruit it
/// yielded does accrue: the harvested amount is mirrored onto the orchard's
/// <see cref="TreeProduct"/> as a <see cref="HarvestProduct"/> row, which is what puts it in that
/// product's ledger and balance.
/// </summary>
public class HarvestTreeRepository(
    AppDbContext context,
    IHarvestProductRepository harvestProductRepository) : IHarvestTreeRepository
{
    public async Task<IEnumerable<HarvestTree>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestTrees
            .AsNoTracking()
            .Where(h => h.HarvestId == harvestId)
            .OrderBy(h => h.Id)
            .ToListAsync();
    }

    public async Task<HarvestTree?> GetByIdAsync(int id)
    {
        return await context.HarvestTrees.FindAsync(id);
    }

    public async Task<bool> ExistsForHarvestAsync(int harvestId, int treeStockId, int? excludeId = null)
    {
        return await context.HarvestTrees
            .AnyAsync(h => h.HarvestId == harvestId
                && h.TreeStockId == treeStockId
                && (excludeId == null || h.Id != excludeId));
    }

    public async Task<HarvestTree> AddAsync(HarvestTree harvestTree)
    {
        context.HarvestTrees.Add(harvestTree);
        await context.SaveChangesAsync();

        await SyncProduceAsync(harvestTree.HarvestId, harvestTree.TreeStockId, harvestTree.HarvestedAmount);
        return harvestTree;
    }

    public async Task<bool> UpdateAsync(HarvestTree harvestTree)
    {
        var existing = await context.HarvestTrees.FindAsync(harvestTree.Id);
        if (existing is null)
        {
            return false;
        }

        var previousStockId = existing.TreeStockId;

        existing.TreeStockId = harvestTree.TreeStockId;
        existing.Amount = harvestTree.Amount;
        existing.HarvestedAmount = harvestTree.HarvestedAmount;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();

        // Moved to another orchard: the one it left has nothing from this harvest any more.
        if (previousStockId != existing.TreeStockId)
        {
            await SyncProduceAsync(existing.HarvestId, previousStockId, 0);
        }

        await SyncProduceAsync(existing.HarvestId, existing.TreeStockId, existing.HarvestedAmount);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestTrees.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        var (harvestId, treeStockId) = (existing.HarvestId, existing.TreeStockId);

        context.HarvestTrees.Remove(existing);
        await context.SaveChangesAsync();

        await SyncProduceAsync(harvestId, treeStockId, 0);
        return true;
    }

    public async Task<bool> ExistsForTreeStockAsync(int treeStockId)
    {
        return await context.HarvestTrees.AnyAsync(h => h.TreeStockId == treeStockId);
    }

    public async Task<IEnumerable<int>> GetPickedTreeStockIdsAsync()
    {
        return await context.HarvestTrees
            .AsNoTracking()
            .Select(h => h.TreeStockId)
            .Distinct()
            .ToListAsync();
    }

    /// <summary>
    /// Puts <paramref name="harvestedAmount"/> of the orchard's produce on the harvest's books —
    /// one produce row per harvest and product, so it's written in place rather than added to.
    /// That row is what logs the movement the Products page reads, so keeping it in step is what
    /// keeps the balance honest: nothing harvested means no row at all. An orchard with no product
    /// named has nowhere to accrue, so its harvested amount stays a plain record of the picking.
    /// </summary>
    private async Task SyncProduceAsync(int harvestId, int treeStockId, decimal harvestedAmount)
    {
        var treeProductId = await context.TreeStocks
            .Where(s => s.Id == treeStockId)
            .Select(s => s.TreeProductId)
            .FirstOrDefaultAsync();

        if (treeProductId is not int productId)
        {
            return;
        }

        var existing = (await harvestProductRepository.GetAsync(harvestId))
            .FirstOrDefault(p => p.TreeProductId == productId);

        if (harvestedAmount <= 0)
        {
            if (existing is not null)
            {
                await harvestProductRepository.DeleteAsync(existing.Id);
            }
            return;
        }

        if (existing is null)
        {
            await harvestProductRepository.AddAsync(new HarvestProduct
            {
                HarvestId = harvestId,
                TreeProductId = productId,
                Amount = harvestedAmount,
            });
            return;
        }

        existing.Amount = harvestedAmount;
        await harvestProductRepository.UpdateAsync(existing);
    }
}
