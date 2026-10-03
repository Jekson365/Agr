namespace Server.Services.Interfaces;

public interface ITenantProvisioningQueue
{
    void StartNewFarm(int userId);

    Task ProvisionAsync(int userId);

    Task WaitUntilReadyAsync(int userId);

    bool IsPreparingNewFarm(int userId);
}
