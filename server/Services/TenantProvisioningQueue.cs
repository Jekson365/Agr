using System.Collections.Concurrent;
using Server.Services.Interfaces;

namespace Server.Services;

public sealed class TenantProvisioningQueue(
    IServiceScopeFactory scopeFactory,
    ILogger<TenantProvisioningQueue> logger) : ITenantProvisioningQueue, IHostedService
{
    private readonly ConcurrentDictionary<int, Task> runs = new();
    private readonly ConcurrentDictionary<int, byte> newFarms = new();
    private readonly Lock gate = new();

    public void StartNewFarm(int userId)
    {
        newFarms[userId] = 0;
        _ = ProvisionAsync(userId);
    }

    public Task ProvisionAsync(int userId)
    {
        lock (gate)
        {
            if (runs.TryGetValue(userId, out var existing) && !existing.IsFaulted)
            {
                return existing;
            }

            Task run;
            using (ExecutionContext.SuppressFlow())
            {
                run = Task.Run(() => RunAsync(userId));
            }

            runs[userId] = run;
            _ = run.ContinueWith(
                finished => runs.TryRemove(new KeyValuePair<int, Task>(userId, finished)),
                CancellationToken.None,
                TaskContinuationOptions.OnlyOnRanToCompletion,
                TaskScheduler.Default);
            return run;
        }
    }

    public Task WaitUntilReadyAsync(int userId)
    {
        if (!runs.TryGetValue(userId, out var run))
        {
            return Task.CompletedTask;
        }

        return run.IsFaulted ? ProvisionAsync(userId) : run;
    }

    public bool IsPreparingNewFarm(int userId) => newFarms.ContainsKey(userId);

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken) =>
        Task.WhenAny(Task.WhenAll(runs.Values), Task.Delay(Timeout.Infinite, cancellationToken));

    private async Task RunAsync(int userId)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var provisioner = scope.ServiceProvider.GetRequiredService<ITenantDatabaseProvisioner>();
            await provisioner.ProvisionAsync(userId);
            newFarms.TryRemove(userId, out _);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Preparing the farm database of account {UserId} failed.", userId);
            throw;
        }
    }
}
