using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Server.Services.Interfaces;

namespace Server.Services;

public sealed class TenantReadyInterceptor(ITenantProvisioningQueue provisioningQueue) : DbConnectionInterceptor
{
    private const string DatabasePrefix = "farm_user_";

    public override async ValueTask<InterceptionResult> ConnectionOpeningAsync(
        DbConnection connection,
        ConnectionEventData eventData,
        InterceptionResult result,
        CancellationToken cancellationToken = default)
    {
        if (TryReadUserId(connection, out var userId))
        {
            await provisioningQueue.EnsureFarmAsync(userId).WaitAsync(cancellationToken);
        }

        return result;
    }

    public override InterceptionResult ConnectionOpening(
        DbConnection connection,
        ConnectionEventData eventData,
        InterceptionResult result)
    {
        if (TryReadUserId(connection, out var userId))
        {
            provisioningQueue.EnsureFarmAsync(userId).GetAwaiter().GetResult();
        }

        return result;
    }

    private static bool TryReadUserId(DbConnection connection, out int userId)
    {
        userId = 0;
        var database = connection.Database;
        return database.StartsWith(DatabasePrefix, StringComparison.Ordinal)
            && int.TryParse(database.AsSpan(DatabasePrefix.Length), out userId);
    }
}
