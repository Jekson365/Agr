using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class ConfigurationRepository(AppDbContext context) : IConfigurationRepository
{
    public async Task<IEnumerable<Configuration>> GetAllAsync()
    {
        return await context.Configurations.AsNoTracking().OrderBy(c => c.Id).ToListAsync();
    }

    public async Task<Configuration?> SetValueAsync(string name, int value)
    {
        var configuration = await context.Configurations.FirstOrDefaultAsync(c => c.Name == name);
        if (configuration is null)
        {
            return null;
        }

        configuration.Value = value;
        await context.SaveChangesAsync();
        return configuration;
    }
}
