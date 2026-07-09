namespace Server.Services.Interfaces;

/// <summary>Resolves the connection string for the per-user database of the current request.</summary>
public interface ITenantConnectionProvider
{
    /// <summary>Connection string for the current authenticated user's database.</summary>
    string GetConnectionString();

    /// <summary>Builds a connection string for an arbitrary database name on the same server.</summary>
    string BuildConnectionString(string databaseName);
}
