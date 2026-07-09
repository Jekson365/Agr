using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class FarmRepository(AppDbContext context) : IFarmRepository
{
    public async Task<IEnumerable<Farm>> GetAllAsync()
    {
        return await context.Farms.AsNoTracking().ToListAsync();
    }

    public async Task<Farm?> GetByIdAsync(int id)
    {
        return await context.Farms.FindAsync(id);
    }

    public async Task<Farm> AddAsync(Farm farm)
    {
        context.Farms.Add(farm);
        await context.SaveChangesAsync();
        return farm;
    }

    public async Task<bool> UpdateAsync(Farm farm)
    {
        var existing = await context.Farms.FindAsync(farm.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = farm.Name;
        existing.ImagePath = farm.ImagePath;
        existing.Area = farm.Area;
        existing.Location = farm.Location;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Farms.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.Farms.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
