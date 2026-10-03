namespace Server.Services.Interfaces;

public interface ITenantProvisioningQueue
{
    Task ProvisionAsync(int userId);

    Task EnsureFarmAsync(int userId);

    Task<bool> IsFarmCreatedAsync(int userId);
}
