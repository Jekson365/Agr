using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Controllers;

/// <summary>
/// One account's feature switches, read and written by the platform operator.
///
/// These rows live in the account's own tenant database, not in master, so this opens that
/// database directly — the same thing <see cref="Services.NeighbourTerritoryService"/> does to
/// draw a neighbour's boundaries. It is deliberately the only way a switch is written: the
/// tenant-facing controller offers reads alone.
/// </summary>
public partial class AdminController
{
    public record SetConfigurationRequest(int Value);

    [HttpGet("users/{id:int}/configurations")]
    public async Task<ActionResult<IEnumerable<Configuration>>> GetUserConfigurations(int id)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        var db = await OpenTenantAsync(id);
        if (db is null)
        {
            return NotFound();
        }

        await using (db)
        {
            return Ok(await db.Configurations.AsNoTracking().OrderBy(c => c.Id).ToListAsync());
        }
    }

    [HttpPut("users/{id:int}/configurations/{name}")]
    public async Task<ActionResult<Configuration>> SetUserConfiguration(int id, string name, SetConfigurationRequest request)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        var db = await OpenTenantAsync(id);
        if (db is null)
        {
            return NotFound();
        }

        await using (db)
        {
            var existing = await db.Configurations.FirstOrDefaultAsync(c => c.Name == name);
            if (existing is null)
            {
                // Settings arrive by seeding, so a name with no row is a typo rather than a new
                // setting — the same answer the tenant-facing read gives.
                return NotFound();
            }

            // Anything non-zero already reads as on; normalising keeps the stored values to the
            // two the clients expect to see.
            existing.Value = request.Value == 0 ? 0 : 1;
            await db.SaveChangesAsync();

            logger.LogInformation(
                "Configuration {Name} set to {Value} for user {UserId} by operator {OperatorId} ({Email})",
                name, existing.Value, id, op.Id, op.Email);

            return Ok(existing);
        }
    }

    /// <summary>
    /// A context on the named user's own database, or null when no such user exists. The caller
    /// owns it — every use here disposes it, since it holds a connection of its own rather than
    /// the request's.
    /// </summary>
    private async Task<AppDbContext?> OpenTenantAsync(int userId)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return null;
        }

        var databaseName = string.IsNullOrEmpty(user.DbName) ? $"farm_user_{user.Id}" : user.DbName;
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionProvider.BuildConnectionString(databaseName))
            .Options;

        return new AppDbContext(options);
    }
}
