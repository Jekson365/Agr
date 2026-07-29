using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class HarvestRepository(
    AppDbContext context,
    IHarvestStockSync harvestStockSync,
    IHarvestProductRepository harvestProductRepository,
    ISeedRepository seedRepository) : IHarvestRepository
{
    public async Task<IEnumerable<Harvest>> GetAllAsync(HarvestKind? kind = null)
    {
        var query = context.Harvests.AsNoTracking().AsQueryable();
        if (kind is not null)
        {
            query = query.Where(h => h.Kind == kind);
        }
        return await query.OrderByDescending(h => h.Date).ToListAsync();
    }

    public async Task<Harvest?> GetByIdAsync(int id)
    {
        return await context.Harvests.FindAsync(id);
    }

    public async Task<Harvest> AddAsync(Harvest harvest)
    {
        context.Harvests.Add(harvest);
        await context.SaveChangesAsync();
        return harvest;
    }

    public async Task<bool> UpdateAsync(Harvest harvest)
    {
        var existing = await context.Harvests.FindAsync(harvest.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Title = harvest.Title;
        existing.Date = harvest.Date;
        existing.Status = harvest.Status;
        existing.ExpectedHarvestDate = harvest.ExpectedHarvestDate;
        existing.FarmId = harvest.FarmId;
        existing.LandPlotId = harvest.LandPlotId;
        existing.EquipmentCost = harvest.EquipmentCost;
        existing.WorkersCost = harvest.WorkersCost;
        existing.FuelCost = harvest.FuelCost;
        existing.OtherCost = harvest.OtherCost;
        existing.Revenue = harvest.Revenue;

        await context.SaveChangesAsync();

        // A harvest's yield is on the books only while it is Harvested, so the status is what
        // decides whether it counts — crossing that line either way rewrites what it contributes.
        // Both syncs compare against what is already recorded, so an edit that leaves the status
        // alone costs a comparison and changes nothing.
        await harvestStockSync.SyncAsync(harvest.Id);

        // A fruit harvest's yield accrues on its tree product's ledger instead of on stock, but
        // under the same rule.
        await harvestProductRepository.SyncMovementsForHarvestAsync(harvest.Id);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Harvests.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Deleting the harvest cascades away its plan, results, seed usage and the movement rows
        // that explain them — but not the balances those movements moved. Undo them first, or the
        // stock keeps yield it never had and the seed stays down by an amount nothing records.
        await harvestStockSync.ClearAsync(id);
        await ReturnSeedsAsync(id);

        context.Harvests.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    /// <summary>Gives back the seed this harvest recorded as sown.</summary>
    private async Task ReturnSeedsAsync(int harvestId)
    {
        var usage = await context.HarvestSeeds.AsNoTracking().Where(s => s.HarvestId == harvestId).ToListAsync();
        foreach (var row in usage)
        {
            await seedRepository.AdjustAmountRawAsync(row.SeedId, row.Amount);
        }
    }

}
