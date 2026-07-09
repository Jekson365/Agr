namespace Server.Services.Interfaces;

/// <summary>
/// Creates and migrates the dedicated Postgres database for a user (<c>farm_user_{userId}</c>).
/// Invoked once, right after the user registers.
/// </summary>
public interface ITenantDatabaseProvisioner
{
    /// <summary>Ensures the user's database exists and its schema is up to date.</summary>
    Task ProvisionAsync(int userId);
}
