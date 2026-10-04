using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Admin;
using Server.Services.Interfaces;

namespace Server.Controllers;

public partial class AdminController
{
    [HttpGet("users/{id:int}/overview")]
    public async Task<ActionResult<AdminUserOverviewDto>> GetUserOverview(
        int id,
        [FromServices] ITenantDatabaseProvisioner provisioner)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        var listingCount = await context.MarketListings.CountAsync(l => l.SellerId == id);
        var overview = new AdminUserOverviewDto { User = AdminUserDto.From(user, listingCount) };

        if (!await provisioner.ExistsAsync(id))
        {
            overview.Database = TenantDatabaseStatus.Missing;
            return Ok(overview);
        }

        var db = await OpenTenantAsync(id);
        if (db is null)
        {
            return NotFound();
        }

        await using (db)
        {
            if ((await db.Database.GetPendingMigrationsAsync()).Any())
            {
                overview.Database = TenantDatabaseStatus.Outdated;
                return Ok(overview);
            }

            await FillHoldingsAsync(overview, db);
        }

        return Ok(overview);
    }

    [HttpPost("users/{id:int}/migrate")]
    public async Task<IActionResult> MigrateUserDatabase(
        int id,
        [FromServices] ITenantDatabaseProvisioner provisioner,
        [FromServices] ITenantProvisioningQueue provisioningQueue)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        if (!await context.Users.AnyAsync(u => u.Id == id))
        {
            return NotFound();
        }

        if (!await provisioner.ExistsAsync(id))
        {
            return Conflict("This account has no farm database.");
        }

        await provisioningQueue.ProvisionAsync(id);

        logger.LogInformation(
            "Farm database of account {UserId} brought up to date by operator {OperatorId} ({Email})",
            id, op.Id, op.Email);

        return NoContent();
    }

    private static async Task FillHoldingsAsync(AdminUserOverviewDto overview, AppDbContext db)
    {
        overview.Farms = await db.Farms.AsNoTracking()
            .OrderBy(f => f.Id)
            .Select(f => new AdminFarmDto
            {
                Id = f.Id,
                Name = f.Name,
                ImagePath = f.ImagePath,
                Area = f.Area,
                Location = f.Location,
                IsRemoved = f.IsRemoved,
            })
            .ToListAsync();

        var plots = await db.LandPlots.AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new AdminPlotDto { Id = p.Id, FarmId = p.FarmId, Area = p.Area, Crop = p.Crop })
            .ToListAsync();

        foreach (var farm in overview.Farms)
        {
            farm.Plots = plots.Where(p => p.FarmId == farm.Id).ToList();
        }

        var farmNames = overview.Farms.ToDictionary(f => f.Id, f => f.Name);
        var plotFarms = plots.ToDictionary(p => p.Id, p => p.FarmId);

        overview.Stocks = await db.Stocks.AsNoTracking()
            .OrderBy(s => s.IsDeleted).ThenBy(s => s.Id)
            .Select(s => new AdminStockDto
            {
                Id = s.Id, Type = s.Type, Name = s.Name, Amount = s.Amount, Unit = s.Unit, IsDeleted = s.IsDeleted,
            })
            .ToListAsync();

        var herds = await db.Livestock.AsNoTracking()
            .OrderBy(l => l.IsDeleted).ThenBy(l => l.Id)
            .Select(l => new { l.Id, l.Type, l.Name, l.Count, l.FarmId, l.IsDeleted })
            .ToListAsync();
        overview.Livestock = herds.Select(l => new AdminLivestockDto
        {
            Id = l.Id, Type = l.Type, Name = l.Name, Count = l.Count, IsDeleted = l.IsDeleted,
            FarmName = farmNames.GetValueOrDefault(l.FarmId, string.Empty),
        }).ToList();

        var trees = await db.TreeStocks.AsNoTracking()
            .OrderBy(t => t.IsDeleted).ThenBy(t => t.Id)
            .Select(t => new { t.Id, t.Type, t.Name, t.Amount, t.Unit, t.LandPlotId, t.IsDeleted })
            .ToListAsync();
        overview.TreeStocks = trees.Select(t => new AdminTreeStockDto
        {
            Id = t.Id, Type = t.Type, Name = t.Name, Amount = t.Amount, Unit = t.Unit, IsDeleted = t.IsDeleted,
            FarmName = t.LandPlotId is int plotId && plotFarms.TryGetValue(plotId, out var farmId)
                ? farmNames.GetValueOrDefault(farmId, string.Empty)
                : string.Empty,
        }).ToList();

        overview.Harvests = await ReadHarvestsAsync(db, farmNames);
    }
}
