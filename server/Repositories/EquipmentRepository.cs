using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class EquipmentRepository(AppDbContext context) : IEquipmentRepository
{
    public async Task<IEnumerable<Equipment>> GetAllAsync()
    {
        return await context.Equipment.AsNoTracking().ToListAsync();
    }

    public async Task<Equipment?> GetByIdAsync(int id)
    {
        return await context.Equipment.FindAsync(id);
    }

    public async Task<Equipment> AddAsync(Equipment equipment)
    {
        context.Equipment.Add(equipment);
        await context.SaveChangesAsync();
        return equipment;
    }

    public async Task<bool> UpdateAsync(Equipment equipment)
    {
        var existing = await context.Equipment.FindAsync(equipment.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = equipment.Name;
        existing.Quantity = equipment.Quantity;
        existing.ImagePath = equipment.ImagePath;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Equipment.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.Equipment.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
