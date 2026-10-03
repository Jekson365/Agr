using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Services;

public sealed class TenantProvisioningQueue(
    IServiceScopeFactory scopeFactory,
    ILogger<TenantProvisioningQueue> logger) : ITenantProvisioningQueue, IHostedService
{
    private readonly ConcurrentDictionary<int, Task> runs = new();
    private readonly ConcurrentDictionary<int, byte> createdFarms = new();
    private readonly Lock gate = new();

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

    public async Task EnsureFarmAsync(int userId)
    {
        if (!await IsFarmCreatedAsync(userId))
        {
            await ProvisionAsync(userId);
            return;
        }

        if (runs.TryGetValue(userId, out var run))
        {
            await (run.IsFaulted ? ProvisionAsync(userId) : run);
        }
    }

    public async Task<bool> IsFarmCreatedAsync(int userId)
    {
        if (createdFarms.ContainsKey(userId))
        {
            return true;
        }

        await using var scope = scopeFactory.CreateAsyncScope();
        var master = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
        var created = await master.Users.AnyAsync(u => u.Id == userId && u.DatabaseCreatedAt != null);
        if (created)
        {
            createdFarms[userId] = 0;
        }

        return created;
    }

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

            var master = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
            await master.Users
                .Where(u => u.Id == userId && u.DatabaseCreatedAt == null)
                .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.DatabaseCreatedAt, DateTime.UtcNow));
            createdFarms[userId] = 0;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Preparing the farm database of account {UserId} failed.", userId);
            throw;
        }
    }
}
