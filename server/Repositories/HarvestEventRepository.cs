using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>A harvest's day notes — plain CRUD, like <see cref="HarvestChemicalRepository"/>.</summary>
public class HarvestEventRepository(AppDbContext context) : IHarvestEventRepository
{
    public async Task<IEnumerable<HarvestEvent>> GetAsync(int? harvestId = null)
    {
        var query = context.HarvestEvents.AsNoTracking().AsQueryable();
        if (harvestId is not null)
        {
            query = query.Where(e => e.HarvestId == harvestId);
        }

        return await query.OrderBy(e => e.Date).ThenBy(e => e.Id).ToListAsync();
    }

    public async Task<HarvestEvent> AddAsync(HarvestEvent harvestEvent)
    {
        context.HarvestEvents.Add(harvestEvent);
        await context.SaveChangesAsync();
        return harvestEvent;
    }

    public async Task<bool> UpdateAsync(HarvestEvent harvestEvent)
    {
        var existing = await context.HarvestEvents.FindAsync(harvestEvent.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Date = harvestEvent.Date;
        existing.Description = harvestEvent.Description;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestEvents.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.HarvestEvents.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
