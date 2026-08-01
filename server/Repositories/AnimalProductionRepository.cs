using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class AnimalProductionRepository(AppDbContext context) : IAnimalProductionRepository
{
    public async Task<IEnumerable<AnimalProduction>> GetAllAsync()
    {
        return await context.AnimalProductions
            .AsNoTracking()
            .OrderBy(p => p.CollectionDate)
            .ToListAsync();
    }

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

    public async Task<AnimalProduction?> GetByIdAsync(int id)
    {
        return await context.AnimalProductions.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> ExistsForLivestockAsync(int livestockId)
    {
        var animalIds = context.LivestockDetails
            .Where(d => d.LivestockId == livestockId)
            .Select(d => d.Id);

        return await context.AnimalProductions
            .AnyAsync(p => p.LivestockId == livestockId || (p.AnimalId != null && animalIds.Contains(p.AnimalId.Value)));
    }

    public async Task<bool> ExistsForAnimalAsync(int animalId)
    {
        return await context.AnimalProductions.AnyAsync(p => p.AnimalId == animalId);
    }

    public async Task<AnimalProduction> AddAsync(AnimalProduction production)
    {
        context.AnimalProductions.Add(production);
        await context.SaveChangesAsync();
        return production;
    }

    public async Task<bool> UpdateAsync(AnimalProduction production)
    {
        var existing = await context.AnimalProductions.FindAsync(production.Id);
        if (existing is null)
        {
            return false;
        }

        existing.AnimalCount = production.AnimalCount;
        existing.ProductionTypeId = production.ProductionTypeId;
        existing.CollectionDate = production.CollectionDate;
        existing.Quantity = production.Quantity;
        existing.UnitId = production.UnitId;
        existing.Quality = production.Quality;
        existing.PricePerUnit = production.PricePerUnit;
        existing.TotalPrice = production.TotalPrice;
        existing.CollectedBy = production.CollectedBy;
        existing.BatchNumber = production.BatchNumber;
        existing.Notes = production.Notes;

        await context.SaveChangesAsync();
        return true;
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
