using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class PlanLimitLock(AppDbContext context) : IPlanLimitLock
{
    public async Task<IDbContextTransaction> AcquireAsync(PlanResource resource)
    {
        var transaction = await context.Database.BeginTransactionAsync();
        await context.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({(long)resource})");
        return transaction;
    }
}
