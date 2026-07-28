using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeProductRepository(AppDbContext context) : ITreeProductRepository
{
    public async Task<IEnumerable<TreeProduct>> GetAllAsync()
    {
        return await context.TreeProducts.AsNoTracking().OrderBy(p => p.Id).ToListAsync();
    }

    public async Task<TreeProduct?> GetByIdAsync(int id)
    {
        return await context.TreeProducts.FindAsync(id);
    }

    public async Task<TreeProduct> AddAsync(TreeProduct product)
    {
        context.TreeProducts.Add(product);
        await context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> UpdateAsync(TreeProduct product)
    {
        var existing = await context.TreeProducts.FindAsync(product.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = product.Name;
        existing.Unit = product.Unit;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.TreeProducts.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.TreeProducts.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
