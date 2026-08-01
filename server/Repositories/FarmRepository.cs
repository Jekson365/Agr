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
        // A client that doesn't know about the territory leaves Boundary out of its payload, which
        // arrives here as null. Writing that through would erase the outline drawn on the web on
        // the next edit from such a client, so null means "leave it as it is" — clearing the
        // territory is sent as an empty array.
        if (farm.Boundary is not null)
        {
            existing.Boundary = farm.Boundary;
        }

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
