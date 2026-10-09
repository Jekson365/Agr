using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Admin;

namespace Server.Controllers;

public partial class AdminController
{
    private static async Task FillDetailsAsync(AdminUserOverviewDto overview, AppDbContext db)
    {
        overview.Seeds = await db.Seeds.AsNoTracking()
            .OrderBy(s => s.IsDeleted).ThenBy(s => s.Id)
            .Select(s => new AdminSeedDto
            {
                Id = s.Id, Type = s.Type, Name = s.Name, Amount = s.Amount, Unit = s.Unit, IsDeleted = s.IsDeleted,
            })
            .ToListAsync();

        overview.Equipment = await db.Equipment.AsNoTracking()
            .OrderBy(e => e.Id)
            .Select(e => new AdminEquipmentDto { Id = e.Id, Name = e.Name, Quantity = e.Quantity, ImagePath = e.ImagePath })
            .ToListAsync();

        var balances = await db.WineMovements.AsNoTracking()
            .GroupBy(m => m.WineBatchId)
            .Select(g => new { BatchId = g.Key, Liters = g.Sum(m => m.Delta), Bottles = g.Sum(m => m.BottleDelta) })
            .ToDictionaryAsync(x => x.BatchId);

        var batches = await db.WineBatches.AsNoTracking()
            .OrderBy(b => b.IsDeleted).ThenByDescending(b => b.Vintage).ThenBy(b => b.Id)
            .Select(b => new { b.Id, b.Name, b.Vintage, b.Stage, b.IsDeleted })
            .ToListAsync();
        overview.WineBatches = batches.Select(b =>
        {
            var balance = balances.GetValueOrDefault(b.Id);
            return new AdminWineBatchDto
            {
                Id = b.Id, Name = b.Name, Vintage = b.Vintage, Stage = b.Stage, IsDeleted = b.IsDeleted,
                Liters = balance?.Liters ?? 0,
                Bottles = balance?.Bottles ?? 0,
            };
        }).ToList();

        overview.Records = new AdminRecordCountsDto
        {
            Animals = await db.LivestockDetails.CountAsync(),
            Productions = await db.AnimalProductions.CountAsync(),
            Purchases = await db.PurchaseDocuments.CountAsync(),
            CalendarEvents = await db.CalendarEvents.CountAsync(),
            HarvestEvents = await db.HarvestEvents.CountAsync(),
            PlantScans = await db.PlantScanHistories.CountAsync(),
        };
    }
}
