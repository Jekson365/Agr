using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class ProductionTypeRepository(AppDbContext context) : IProductionTypeRepository
{
    public async Task<IEnumerable<ProductionType>> GetAllAsync()
    {
        return await context.ProductionTypes
            .AsNoTracking()
            .OrderBy(t => t.Id)
            .ToListAsync();
    }
}
