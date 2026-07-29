using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>A recorded result is the better answer for its good than the plan that forecast it,
/// so writing one takes the plan's contribution off the books and puts its own on — see
/// <see cref="IHarvestStockSync"/>, which decides all of that.</summary>
public class HarvestResultRepository(AppDbContext context, IHarvestStockSync harvestStockSync) : IHarvestResultRepository
{
    public async Task<IEnumerable<HarvestResult>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestResults
            .AsNoTracking()
            .Where(r => r.HarvestId == harvestId)
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<HarvestResult> AddAsync(HarvestResult result)
    {
        context.HarvestResults.Add(result);
        await context.SaveChangesAsync();

        await harvestStockSync.SyncAsync(result.HarvestId);
        return result;
    }

    public async Task<bool> UpdateAsync(HarvestResult result)
    {
        var existing = await context.HarvestResults.FindAsync(result.Id);
        if (existing is null)
        {
            return false;
        }

        existing.StockId = result.StockId;
        existing.TreeStockId = result.TreeStockId;
        existing.Amount = result.Amount;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();

        // Covers a retarget as well as a plain edit: the good it left may have a plan waiting to
        // take the row's place, and the good it moved to may have one to displace.
        await harvestStockSync.SyncAsync(existing.HarvestId);
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestResults.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // Removing the row cascades its movement away without giving back the amount that movement
        // added, so the row is taken off the books first — while it is still here to be found.
        // That same pass hands the good back to its plan, if one forecast it.
        await harvestStockSync.SyncAsync(existing.HarvestId, excludeResultId: id);

        context.HarvestResults.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
