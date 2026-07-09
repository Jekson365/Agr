using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class AnimalProductionRepository(AppDbContext context) : IAnimalProductionRepository
{
    public async Task<IEnumerable<AnimalProduction>> GetByAnimalAsync(int animalId)
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .Where(p => p.AnimalId == animalId)
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<AnimalProduction>> GetByLivestockAsync(int livestockId)
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .Where(p => p.LivestockId == livestockId)
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

    public async Task<AnimalProduction> AddAsync(AnimalProduction production)
    {
        context.AnimalProductions.Add(production);
        await context.SaveChangesAsync();
        return production;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.AnimalProductions.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.AnimalProductions.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
