using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseHarvestRepository(
    AppDbContext context,
    IGreenhouseStockRepository greenhouseStockRepository,
    IGreenhouseSeedRepository greenhouseSeedRepository) : IGreenhouseHarvestRepository
{
    public async Task<IEnumerable<GreenhouseHarvest>> GetAllAsync(int? greenhouseId = null)
    {
        var query = context.GreenhouseHarvests.AsNoTracking().AsQueryable();
        if (greenhouseId is int id)
        {
            query = query.Where(h => h.GreenhouseId == id);
        }
        return await query.OrderByDescending(h => h.Date).ThenByDescending(h => h.Id).ToListAsync();
    }

    public async Task<GreenhouseHarvest?> GetByIdAsync(int id)
    {
        return await context.GreenhouseHarvests.FindAsync(id);
    }

    public async Task<IEnumerable<GreenhouseHarvestSummary>> GetSummariesAsync(
        int greenhouseId,
        HarvestStatus? status,
        DateOnly? from,
        DateOnly? to,
        int limit)
    {
        var query = context.GreenhouseHarvests
            .AsNoTracking()
            .Where(h => h.GreenhouseId == greenhouseId);

        if (status is HarvestStatus wanted)
        {
            query = query.Where(h => h.Status == wanted);
        }
        if (from is DateOnly start)
        {
            query = query.Where(h => h.Date >= start);
        }
        if (to is DateOnly end)
        {
            query = query.Where(h => h.Date <= end);
        }

        var harvests = await query
            .OrderByDescending(h => h.Date)
            .ThenByDescending(h => h.Id)
            .Take(limit)
            .ToListAsync();

        // One more query for every result on the page, rather than one per harvest.
        var ids = harvests.Select(h => h.Id).ToList();
        var results = await context.GreenhouseHarvestResults
            .AsNoTracking()
            .Where(r => ids.Contains(r.GreenhouseHarvestId))
            .OrderBy(r => r.Id)
            .ToListAsync();

        var byHarvest = results
            .GroupBy(r => r.GreenhouseHarvestId)
            .ToDictionary(group => group.Key, group => group.ToList());

        return harvests.Select(harvest => new GreenhouseHarvestSummary
        {
            Harvest = harvest,
            Results = byHarvest.TryGetValue(harvest.Id, out var own) ? own : [],
        });
    }

    public async Task<GreenhouseHarvest> AddAsync(GreenhouseHarvest harvest)
    {
        context.GreenhouseHarvests.Add(harvest);
        await context.SaveChangesAsync();
        return harvest;
    }

    public async Task<bool> UpdateAsync(GreenhouseHarvest harvest)
    {
        var existing = await context.GreenhouseHarvests.FindAsync(harvest.Id);
        if (existing is null)
        {
            return false;
        }

        var previousStatus = existing.Status;

        existing.GreenhouseId = harvest.GreenhouseId;
        existing.Title = harvest.Title;
        existing.Date = harvest.Date;
        existing.Status = harvest.Status;
        existing.ExpectedHarvestDate = harvest.ExpectedHarvestDate;
        existing.EquipmentCost = harvest.EquipmentCost;
        existing.WorkersCost = harvest.WorkersCost;
        existing.FuelCost = harvest.FuelCost;
        existing.OtherCost = harvest.OtherCost;
        existing.Revenue = harvest.Revenue;

        await context.SaveChangesAsync();

        // Stock is only ever adjusted for a harvest's recorded results once, at the moment it
        // becomes Harvested; moving off Harvested again reverses that same contribution.
        if (previousStatus != HarvestStatus.Harvested && harvest.Status == HarvestStatus.Harvested)
        {
            await ApplyStockAsync(harvest.Id);
        }
        else if (previousStatus == HarvestStatus.Harvested && harvest.Status != HarvestStatus.Harvested)
        {
            await ReverseStockAsync(harvest.Id);
        }

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseHarvests.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Deleting the harvest cascades away its results, seed usage and chemicals — but not the
        // balances those results/seed moved. Undo them first, or the stock keeps yield it never
        // had and the seed stays down by an amount nothing records.
        if (existing.Status == HarvestStatus.Harvested)
        {
            await ReverseStockAsync(id);
        }
        await ReturnSeedsAsync(id);

        context.GreenhouseHarvests.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForGreenhouseAsync(int greenhouseId)
    {
        return await context.GreenhouseHarvests.AnyAsync(h => h.GreenhouseId == greenhouseId);
    }

    /// <summary>Gives back the seed this harvest recorded as sown.</summary>
    private async Task ReturnSeedsAsync(int greenhouseHarvestId)
    {
        var usage = await context.GreenhouseHarvestSeeds.AsNoTracking()
            .Where(s => s.GreenhouseHarvestId == greenhouseHarvestId)
            .ToListAsync();
        foreach (var row in usage)
        {
            await greenhouseSeedRepository.AdjustAmountRawAsync(row.GreenhouseSeedId, row.Amount);
        }
    }

    private async Task ApplyStockAsync(int greenhouseHarvestId)
    {
        var results = await context.GreenhouseHarvestResults.AsNoTracking()
            .Where(r => r.GreenhouseHarvestId == greenhouseHarvestId)
            .ToListAsync();
        foreach (var result in results)
        {
            await greenhouseStockRepository.AdjustAmountRawAsync(result.GreenhouseStockId, result.Amount);
        }
    }

    private async Task ReverseStockAsync(int greenhouseHarvestId)
    {
        var results = await context.GreenhouseHarvestResults.AsNoTracking()
            .Where(r => r.GreenhouseHarvestId == greenhouseHarvestId)
            .ToListAsync();
        foreach (var result in results)
        {
            await greenhouseStockRepository.AdjustAmountRawAsync(result.GreenhouseStockId, -result.Amount);
        }
    }
}
