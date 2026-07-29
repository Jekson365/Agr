using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>Fruit produce accrues on its own product rather than into plant stock, so the only
/// balance to keep in step is that product's movement ledger — and, as with a crop result, it only
/// counts while the harvest it came from is Harvested.</summary>
public class HarvestProductRepository(
    AppDbContext context,
    ITreeProductMovementRepository treeProductMovementRepository) : IHarvestProductRepository
{
    public async Task<IEnumerable<HarvestProduct>> GetAsync(int? harvestId = null)
    {
        var query = context.HarvestProducts.AsNoTracking().AsQueryable();
        if (harvestId is not null)
        {
            query = query.Where(p => p.HarvestId == harvestId);
        }
        return await query.OrderBy(p => p.Id).ToListAsync();
    }

    public async Task<bool> ExistsForProductAsync(int treeProductId)
    {
        return await context.HarvestProducts.AnyAsync(p => p.TreeProductId == treeProductId);
    }

    public async Task<HarvestProduct> AddAsync(HarvestProduct harvestProduct)
    {
        context.HarvestProducts.Add(harvestProduct);
        await context.SaveChangesAsync();

        await SyncMovementAsync(harvestProduct, await IsHarvestedAsync(harvestProduct.HarvestId));
        return harvestProduct;
    }

    public async Task<bool> UpdateAsync(HarvestProduct harvestProduct)
    {
        var existing = await context.HarvestProducts.FindAsync(harvestProduct.Id);
        if (existing is null)
        {
            return false;
        }

        existing.TreeProductId = harvestProduct.TreeProductId;
        existing.Amount = harvestProduct.Amount;

        await context.SaveChangesAsync();

        await SyncMovementAsync(existing, await IsHarvestedAsync(existing.HarvestId));
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestProducts.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.HarvestProducts.Remove(existing);
        await context.SaveChangesAsync();

        await treeProductMovementRepository.DeleteForHarvestProductAsync(id);
        return true;
    }

    public async Task SyncMovementsForHarvestAsync(int harvestId)
    {
        var harvested = await IsHarvestedAsync(harvestId);
        var rows = await context.HarvestProducts.AsNoTracking().Where(p => p.HarvestId == harvestId).ToListAsync();
        foreach (var row in rows)
        {
            await SyncMovementAsync(row, harvested);
        }
    }

    private async Task<bool> IsHarvestedAsync(int harvestId)
    {
        var status = await context.Harvests
            .AsNoTracking()
            .Where(h => h.Id == harvestId)
            .Select(h => (HarvestStatus?)h.Status)
            .FirstOrDefaultAsync();
        return status == HarvestStatus.Harvested;
    }

    /// <summary>
    /// Keeps a produce row's movement in step with what the row now says. The fruit only counts
    /// towards the product's balance once the harvest is Harvested — until then (and again after
    /// it's moved back off Harvested) the row is a plan, so it carries no movement at all.
    /// </summary>
    private async Task SyncMovementAsync(HarvestProduct harvestProduct, bool harvested)
    {
        if (!harvested)
        {
            await treeProductMovementRepository.DeleteForHarvestProductAsync(harvestProduct.Id);
            return;
        }

        // One movement per row, edited in place, so the history doesn't grow an entry per edit.
        var updated = await treeProductMovementRepository.UpdateForHarvestProductAsync(harvestProduct.Id, harvestProduct.Amount);
        if (!updated)
        {
            await treeProductMovementRepository.AddAsync(new TreeProductMovement
            {
                TreeProductId = harvestProduct.TreeProductId,
                HarvestProductId = harvestProduct.Id,
                Delta = harvestProduct.Amount,
                Source = TreeProductMovementSource.Harvest,
            });
        }
    }
}
