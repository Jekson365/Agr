using Microsoft.EntityFrameworkCore.Storage;
using Server.Models;

namespace Server.Services.Interfaces;

public interface IPlanLimitLock
{
    Task<IDbContextTransaction> AcquireAsync(PlanResource resource);
}
