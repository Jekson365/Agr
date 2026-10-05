using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public partial class WineBatchRepository(AppDbContext context) : IWineBatchRepository
{
    public async Task<WineBatch?> GetByIdAsync(int id)
    {
        return await context.WineBatches.FindAsync(id);
    }

    public async Task<bool?> IsDeletedAsync(int id)
    {
        return await context.WineBatches
            .Where(b => b.Id == id)
            .Select(b => (bool?)b.IsDeleted)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<WineStageChange>> GetStageChangesAsync(int wineBatchId)
    {
        return await context.WineStageChanges
            .AsNoTracking()
            .Where(c => c.WineBatchId == wineBatchId)
            .OrderBy(c => c.Date)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    public async Task<WineBatch> AddAsync(WineBatch batch)
    {
        context.WineBatches.Add(batch);
        await context.SaveChangesAsync();

        context.WineStageChanges.Add(new WineStageChange
        {
            WineBatchId = batch.Id,
            FromStage = null,
            ToStage = batch.Stage,
            Date = batch.StartDate,
        });
        await context.SaveChangesAsync();
        return batch;
    }

    public async Task<bool> UpdateAsync(WineBatch batch)
    {
        var existing = await context.WineBatches.FindAsync(batch.Id);
        if (existing is null)
        {
            return false;
        }

        if (existing.Stage != batch.Stage)
        {
            context.WineStageChanges.Add(new WineStageChange
            {
                WineBatchId = batch.Id,
                FromStage = existing.Stage,
                ToStage = batch.Stage,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
            });
        }

        existing.Name = batch.Name.Trim();
        existing.Vintage = batch.Vintage;
        existing.Color = batch.Color;
        existing.Method = batch.Method;
        existing.Stage = batch.Stage;
        existing.StartDate = batch.StartDate;
        existing.Notes = string.IsNullOrWhiteSpace(batch.Notes) ? null : batch.Notes.Trim();

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> HasRecordsAsync(int id)
    {
        return await context.WineMovements.AnyAsync(m => m.WineBatchId == id && m.Source != WineMovementSource.Production)
            || await context.WineBottlings.AnyAsync(b => b.WineBatchId == id)
            || await context.WineOperations.AnyAsync(o => o.WineBatchId == id)
            || await context.WineMeasurements.AnyAsync(m => m.WineBatchId == id);
    }

    public async Task DeleteAsync(int id)
    {
        await context.WineBatches.Where(b => b.Id == id).ExecuteDeleteAsync();
    }

    public async Task SoftDeleteAsync(int id)
    {
        await context.WineBatches
            .Where(b => b.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(b => b.IsDeleted, true));
    }
}
