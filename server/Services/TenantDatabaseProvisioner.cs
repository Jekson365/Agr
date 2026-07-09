using Microsoft.EntityFrameworkCore;
using Npgsql;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Services;

/// <summary>
/// Creates and migrates a user's dedicated Postgres database (<c>farm_user_{userId}</c>).
/// The database is created from the "master" connection (which owns the server credentials)
/// and then brought up to date with the <see cref="AppDbContext"/> migrations.
/// </summary>
public class TenantDatabaseProvisioner(
    ITenantConnectionProvider connectionProvider,
    IConfiguration configuration,
    ILogger<TenantDatabaseProvisioner> logger) : ITenantDatabaseProvisioner
{
    public async Task ProvisionAsync(int userId)
    {
        var databaseName = $"farm_user_{userId}";

        await CreateDatabaseIfNotExistsAsync(databaseName);
        await MigrateAsync(databaseName);

        logger.LogInformation("Provisioned tenant database {Database}.", databaseName);
    }

    private async Task CreateDatabaseIfNotExistsAsync(string databaseName)
    {
        // CREATE DATABASE cannot run while connected to the target database, so issue it over
        // the master connection (which points at its own, already-existing database).
        var maintenanceConnectionString = configuration.GetConnectionString("master")
            ?? throw new InvalidOperationException("Missing 'master' connection string.");

        await using var connection = new NpgsqlConnection(maintenanceConnectionString);
        await connection.OpenAsync();

        await using (var exists = new NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @name", connection))
        {
            exists.Parameters.AddWithValue("name", databaseName);
            if (await exists.ExecuteScalarAsync() is not null)
            {
                return;
            }
        }

        // CREATE DATABASE does not accept parameters; the name is derived from an integer user id,
        // but quote it defensively as a Postgres identifier all the same.
        await using var create = new NpgsqlCommand($"CREATE DATABASE {QuoteIdentifier(databaseName)}", connection);
        await create.ExecuteNonQueryAsync();
    }

    private async Task MigrateAsync(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionProvider.BuildConnectionString(databaseName))
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.MigrateAsync();
    }

    private static string QuoteIdentifier(string identifier) =>
        $"\"{identifier.Replace("\"", "\"\"")}\"";
}
