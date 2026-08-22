using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeProductMovementRepository(AppDbContext context) : ITreeProductMovementRepository
{
    public async Task<IEnumerable<TreeProductMovementDto>> GetAsync(int? treeProductId = null)
    {
        var query = context.TreeProductMovements.AsNoTracking().AsQueryable();
        if (treeProductId is not null)
        {
            query = query.Where(m => m.TreeProductId == treeProductId);
        }

        // A harvest movement is owned by the produce row that recorded it, so its harvest — and
        // the date the ledger shows it under — is one hop further on. Left joins throughout:
        // manual and market movements have no produce row and no harvest behind them.
        var rows = await (
            from movement in query
            join produce in context.HarvestProducts.AsNoTracking()
                on movement.HarvestProductId equals produce.Id into producedBy
            from produce in producedBy.DefaultIfEmpty()
            join harvest in context.Harvests.AsNoTracking()
                on produce.HarvestId equals harvest.Id into harvestedBy
            from harvest in harvestedBy.DefaultIfEmpty()
            select new TreeProductMovementDto
            {
                Id = movement.Id,
                TreeProductId = movement.TreeProductId,
                HarvestProductId = movement.HarvestProductId,
                Delta = movement.Delta,
                Source = movement.Source,
                Note = movement.Note,
                Date = movement.Date,
                CreatedAt = movement.CreatedAt,
                HarvestDate = harvest != null ? harvest.Date : null,
            }).ToListAsync();

        // Newest first by the date each row actually shows, which for a harvest is its own date
        // rather than the order the rows happen to have been written in.
        return rows
            .OrderByDescending(r => r.HarvestDate?.ToDateTime(TimeOnly.MinValue) ?? r.CreatedAt)
            .ThenByDescending(r => r.CreatedAt)
            .ToList();
    }

    public async Task<decimal> GetBalanceAsync(int treeProductId)
    {
        return await context.TreeProductMovements
            .Where(m => m.TreeProductId == treeProductId)
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;
    }

    public async Task<TreeProductMovement> AddAsync(TreeProductMovement movement)
    {
        context.TreeProductMovements.Add(movement);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.TreeProductMovements.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.TreeProductMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateForHarvestProductAsync(int harvestProductId, decimal delta)
    {
        var existing = await context.TreeProductMovements.FirstOrDefaultAsync(m => m.HarvestProductId == harvestProductId);
        if (existing is null)
        {
            return false;
        }

        existing.Delta = delta;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteForHarvestProductAsync(int harvestProductId)
    {
        var existing = await context.TreeProductMovements.FirstOrDefaultAsync(m => m.HarvestProductId == harvestProductId);
        if (existing is null)
        {
            return false;
        }

        context.TreeProductMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
