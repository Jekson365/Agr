using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>Applying a chemical changes no balance, so this is plain CRUD.</summary>
public class GreenhouseHarvestChemicalRepository(AppDbContext context) : IGreenhouseHarvestChemicalRepository
{
    public async Task<IEnumerable<GreenhouseHarvestChemical>> GetByHarvestAsync(int greenhouseHarvestId)
    {
        return await context.GreenhouseHarvestChemicals
            .AsNoTracking()
            .Where(c => c.GreenhouseHarvestId == greenhouseHarvestId)
            .OrderBy(c => c.Date)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    public async Task<GreenhouseHarvestChemical> AddAsync(GreenhouseHarvestChemical chemical)
    {
        context.GreenhouseHarvestChemicals.Add(chemical);
        await context.SaveChangesAsync();
        return chemical;
    }

    public async Task<bool> UpdateAsync(GreenhouseHarvestChemical chemical)
    {
        var existing = await context.GreenhouseHarvestChemicals.FindAsync(chemical.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = chemical.Name;
        existing.Date = chemical.Date;
        existing.Cost = chemical.Cost;
        // GreenhouseHarvestId is fixed once created.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.GreenhouseHarvestChemicals.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.GreenhouseHarvestChemicals.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
