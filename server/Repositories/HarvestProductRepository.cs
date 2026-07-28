using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>Plain CRUD: fruit produce accrues on its own product, so there's no other balance to
/// keep in step the way plant stock needs when a crop result is recorded.</summary>
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

        // Harvested produce adds to the product's balance, tracked as a Harvest movement.
        await treeProductMovementRepository.AddAsync(new TreeProductMovement
        {
            TreeProductId = harvestProduct.TreeProductId,
            HarvestProductId = harvestProduct.Id,
            Delta = harvestProduct.Amount,
            Source = TreeProductMovementSource.Harvest,
        });

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
}
