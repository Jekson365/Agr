using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class GreenhouseRepository(AppDbContext context) : IGreenhouseRepository
{
    public async Task<IEnumerable<Greenhouse>> GetAllAsync()
    {
        return await context.Greenhouses.AsNoTracking().OrderBy(g => g.Id).ToListAsync();
    }

    public async Task<Greenhouse?> GetByIdAsync(int id)
    {
        return await context.Greenhouses.FindAsync(id);
    }

    public async Task<Greenhouse> AddAsync(Greenhouse greenhouse)
    {
        context.Greenhouses.Add(greenhouse);
        await context.SaveChangesAsync();
        return greenhouse;
    }

    public async Task<bool> UpdateAsync(Greenhouse greenhouse)
    {
        var existing = await context.Greenhouses.FindAsync(greenhouse.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = greenhouse.Name;
        existing.ImagePath = greenhouse.ImagePath;
        existing.Area = greenhouse.Area;
        existing.EstablishDate = greenhouse.EstablishDate;
        existing.Location = greenhouse.Location;
        existing.Width = greenhouse.Width;
        existing.Length = greenhouse.Length;
        existing.Height = greenhouse.Height;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Greenhouses.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.Greenhouses.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
