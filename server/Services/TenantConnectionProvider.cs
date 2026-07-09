using Npgsql;
using Server.Services.Interfaces;

namespace Server.Services;

/// <summary>
/// Resolves the per-user database connection. Each user's data lives in its own Postgres database
/// named <c>farm_user_{userId}</c>; host and credentials are inherited from the "master" connection.
/// </summary>
public class TenantConnectionProvider(
    ICurrentTenant currentTenant,
    IConfiguration configuration) : ITenantConnectionProvider
{
    public string GetConnectionString()
    {
        var userId = currentTenant.UserId;
        if (userId == 0)
        {
            throw new InvalidOperationException("No authenticated user is associated with the current request.");
        }

        return BuildConnectionString($"farm_user_{userId}");
    }

    public string BuildConnectionString(string databaseName)
    {
        var master = configuration.GetConnectionString("master")
            ?? throw new InvalidOperationException("Missing 'master' connection string.");

        return new NpgsqlConnectionStringBuilder(master) { Database = databaseName }.ConnectionString;
    }
}
