using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Admin;

namespace Server.Controllers;

public partial class AdminController
{
    private static async Task<List<AdminHarvestDto>> ReadHarvestsAsync(AppDbContext db, Dictionary<int, string> farmNames)
    {
        var harvests = await db.Harvests.AsNoTracking()
            .OrderByDescending(h => h.Date).ThenByDescending(h => h.Id)
            .ToListAsync();
        if (harvests.Count == 0)
        {
            return [];
        }

        var chemicals = await db.HarvestChemicals.AsNoTracking()
            .GroupBy(c => c.HarvestId)
            .Select(g => new { HarvestId = g.Key, Cost = g.Sum(c => c.Cost) })
            .ToDictionaryAsync(x => x.HarvestId, x => x.Cost);

        var stockYields = await db.HarvestResults.AsNoTracking()
            .Join(db.Stocks.AsNoTracking(), r => r.StockId, s => (int?)s.Id,
                (r, s) => new { r.HarvestId, s.Type, s.Name, r.Amount, s.Unit })
            .ToListAsync();

        var treeYields = await db.HarvestResults.AsNoTracking()
            .Join(db.TreeStocks.AsNoTracking(), r => r.TreeStockId, t => (int?)t.Id,
                (r, t) => new { r.HarvestId, t.Type, t.Name, r.Amount, t.Unit })
            .ToListAsync();

        var productYields = await db.HarvestProducts.AsNoTracking()
            .Join(db.TreeProducts.AsNoTracking(), p => p.TreeProductId, product => product.Id,
                (p, product) => new { p.HarvestId, product.Name, p.Amount, product.Unit })
            .ToListAsync();

        var yields = stockYields
            .Select(y => (y.HarvestId, Yield: Yield("stock", y.Type, y.Name, y.Amount, y.Unit.ToString())))
            .Concat(treeYields.Select(y => (y.HarvestId, Yield: Yield("tree", y.Type, y.Name, y.Amount, y.Unit.ToString()))))
            .Concat(productYields.Select(y => (y.HarvestId, Yield: Yield("product", y.Name, y.Name, y.Amount, y.Unit.ToString()))))
            .ToLookup(entry => entry.HarvestId, entry => entry.Yield);

        return harvests.Select(h => new AdminHarvestDto
        {
            Id = h.Id,
            Title = h.Title,
            Kind = h.Kind,
            Status = h.Status,
            Date = h.Date,
            ExpectedHarvestDate = h.ExpectedHarvestDate,
            FarmName = h.FarmId is int farmId ? farmNames.GetValueOrDefault(farmId, string.Empty) : string.Empty,
            Revenue = h.Revenue,
            Cost = (h.EquipmentCost ?? 0) + (h.WorkersCost ?? 0) + (h.FuelCost ?? 0) + (h.OtherCost ?? 0)
                + chemicals.GetValueOrDefault(h.Id),
            Yields = yields[h.Id].ToList(),
        }).ToList();
    }

    private static AdminHarvestYieldDto Yield(string source, string type, string name, decimal amount, string unit) =>
        new() { Source = source, Type = type, Name = name, Amount = amount, Unit = unit };
}
