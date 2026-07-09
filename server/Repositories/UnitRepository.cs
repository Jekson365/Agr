using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class UnitRepository(AppDbContext context) : IUnitRepository
{
    public async Task<IEnumerable<Unit>> GetAllAsync()
    {
        return await context.Units
            .AsNoTracking()
            .OrderBy(u => u.Id)
            .ToListAsync();
    }
}
