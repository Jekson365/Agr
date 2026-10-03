using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Server.Data;
using Server.Services.Interfaces;

namespace Server.Services;

[AttributeUsage(AttributeTargets.Method)]
public sealed class SeedWhileProvisioningAttribute(Type rowType) : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var userId = services.GetRequiredService<ICurrentTenant>().UserId;

        if (services.GetRequiredService<ITenantProvisioningQueue>().IsPreparingNewFarm(userId))
        {
            context.Result = new OkObjectResult(ReadSeed(services.GetRequiredService<AppDbContext>()));
            return;
        }

        await next();
    }

    private Array ReadSeed(AppDbContext db)
    {
        var entityType = db.GetService<IDesignTimeModel>().Model.FindEntityType(rowType);
        var seeds = (entityType?.GetSeedData() ?? [])
            .OrderBy(seed => seed.TryGetValue("Id", out var id) ? Convert.ToInt64(id) : 0)
            .ToList();

        var rows = Array.CreateInstance(rowType, seeds.Count);
        for (var i = 0; i < seeds.Count; i++)
        {
            var row = Activator.CreateInstance(rowType)!;
            foreach (var (name, value) in seeds[i])
            {
                rowType.GetProperty(name)?.SetValue(row, value);
            }

            rows.SetValue(row, i);
        }

        return rows;
    }
}
