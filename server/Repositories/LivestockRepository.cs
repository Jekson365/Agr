using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockRepository(AppDbContext context) : ILivestockRepository
{
    public async Task<IEnumerable<Livestock>> GetAllAsync()
    {
        return await context.Livestock.AsNoTracking().ToListAsync();
    }

    public async Task<Livestock?> GetByIdAsync(int id)
    {
        return await context.Livestock.FindAsync(id);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null)
    {
        return await context.Livestock
            .AnyAsync(l => l.Name.ToLower() == name.ToLower() && (excludeId == null || l.Id != excludeId));
    }

    public async Task<Livestock> AddAsync(Livestock livestock)
    {
        context.Livestock.Add(livestock);
        await context.SaveChangesAsync();
        return livestock;
    }

    public async Task<bool> UpdateAsync(Livestock livestock)
    {
        var existing = await context.Livestock.FindAsync(livestock.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = livestock.Name;
        existing.Type = livestock.Type;
        existing.Count = livestock.Count;
        existing.FarmId = livestock.FarmId;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Livestock.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.Livestock.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
