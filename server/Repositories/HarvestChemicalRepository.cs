using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>Applying a chemical changes no balance — see <see cref="HarvestChemical"/> — so this
/// is plain CRUD, like <see cref="HarvestTreeRepository"/>.</summary>
public class HarvestChemicalRepository(AppDbContext context) : IHarvestChemicalRepository
{
    public async Task<IEnumerable<HarvestChemical>> GetByHarvestAsync(int harvestId)
    {
        return await context.HarvestChemicals
            .AsNoTracking()
            .Where(c => c.HarvestId == harvestId)
            .OrderBy(c => c.Date)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    public async Task<HarvestChemical> AddAsync(HarvestChemical harvestChemical)
    {
        context.HarvestChemicals.Add(harvestChemical);
        await context.SaveChangesAsync();
        return harvestChemical;
    }

    public async Task<bool> UpdateAsync(HarvestChemical harvestChemical)
    {
        var existing = await context.HarvestChemicals.FindAsync(harvestChemical.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = harvestChemical.Name;
        existing.Date = harvestChemical.Date;
        existing.Cost = harvestChemical.Cost;
        // HarvestId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.HarvestChemicals.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.HarvestChemicals.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
