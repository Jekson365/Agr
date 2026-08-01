using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Reports;

namespace Server.Repositories;

/// <summary>
/// The drill-downs behind the report's two detail panels — what a clicked bar opens. Each is its
/// own request, so the page only pays for the day or the series actually being looked at.
/// </summary>
public partial class ReportRepository
{
    public async Task<ReportDayDetails> GetDayDetailsAsync(ReportCategory category, DateOnly day)
    {
        var details = new ReportDayDetails { Day = Iso(day) };

        if (category == ReportCategory.Livestock)
        {
            details.Productions = await LivestockDayAsync(day);
            return details;
        }
        if (category == ReportCategory.Greenhouse)
        {
            details.Harvests = await GreenhouseHarvestDayAsync(day);
            return details;
        }

        details.Harvests = await HarvestDayAsync(category, day);
        return details;
    }

    private async Task<List<ReportDayProduction>> LivestockDayAsync(DateOnly day)
    {
        // The column is a timestamp, so the day is bounded rather than compared — that keeps the
        // filter index-friendly instead of calling a conversion on every row.
        var start = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);

        var records = await context.AnimalProductions.AsNoTracking()
            .Where(p => p.CollectionDate >= start && p.CollectionDate < end)
            .ToListAsync();

        var types = await context.ProductionTypes.AsNoTracking().ToDictionaryAsync(pt => pt.Id, pt => pt.Name);
        var units = await context.Units.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u.ShortName);

        return [.. records
            .Select(record => new ReportDayProduction
            {
                ProductionId = record.Id,
                TypeName = types.GetValueOrDefault(record.ProductionTypeId, string.Empty),
                Quantity = record.Quantity,
                Unit = units.GetValueOrDefault(record.UnitId, string.Empty),
                Value = ValueOf(record),
            })
            .OrderBy(row => row.TypeName, StringComparer.CurrentCulture)];
    }

    private async Task<List<ReportDayHarvest>> HarvestDayAsync(ReportCategory category, DateOnly day)
    {
        var kind = KindOf(category);
        var isFruit = category == ReportCategory.Fruit;

        var harvests = await context.Harvests.AsNoTracking()
            .Where(h => h.Kind == kind && h.Status == HarvestStatus.Harvested && h.Date == day)
            .ToListAsync();
        if (harvests.Count == 0)
        {
            return [];
        }

        var ids = harvests.Select(h => h.Id).ToHashSet();
        var items = await context.HarvestItems.AsNoTracking().Where(i => ids.Contains(i.HarvestId)).ToListAsync();
        var results = await context.HarvestResults.AsNoTracking().Where(r => ids.Contains(r.HarvestId)).ToListAsync();
        var seeds = await context.HarvestSeeds.AsNoTracking().Where(s => ids.Contains(s.HarvestId)).ToListAsync();
        var trees = await context.HarvestTrees.AsNoTracking().Where(tr => ids.Contains(tr.HarvestId)).ToListAsync();
        var chemicals = await context.HarvestChemicals.AsNoTracking().Where(c => ids.Contains(c.HarvestId)).ToListAsync();

        var stocks = await context.Stocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);
        var treeStocks = await context.TreeStocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);
        var treeProducts = await context.TreeProducts.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p);
        var seedRows = await context.Seeds.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);

        var rows = new List<ReportDayHarvest>();
        foreach (var harvest in harvests)
        {
            var revenue = harvest.Revenue ?? 0m;
            // Chemicals are an expense like any other, and are summed here so the client can't
            // render a net figure before it knows about them.
            var expenses =
                (harvest.EquipmentCost ?? 0m) + (harvest.WorkersCost ?? 0m) + (harvest.FuelCost ?? 0m) + (harvest.OtherCost ?? 0m)
                + chemicals.Where(c => c.HarvestId == harvest.Id).Sum(c => c.Cost);

            rows.Add(new ReportDayHarvest
            {
                HarvestId = harvest.Id,
                Title = harvest.Title,
                IsFruit = isFruit,
                Revenue = revenue,
                Expenses = expenses,
                Net = revenue - expenses,
                Planned = [.. items
                    .Where(i => i.HarvestId == harvest.Id)
                    .Select(i => GoodFromTarget(i.StockId, i.TreeStockId, i.Amount, i.Unit, stocks, treeStocks))
                    .OfType<ReportGood>()],
                Input = isFruit
                    ? [.. trees
                        .Where(tr => tr.HarvestId == harvest.Id)
                        .Select(tr => GoodFromTree(tr.TreeStockId, tr.Amount, treeStocks))
                        .OfType<ReportGood>()]
                    : [.. seeds
                        .Where(s => s.HarvestId == harvest.Id)
                        .Select(s => GoodFromSeed(s.SeedId, s.Amount, seedRows))
                        .OfType<ReportGood>()],
                // A crop's yield is its recorded results and nothing else — the same CropYield rule
                // the chart and stock both use. What it only planned stays above, under Planned.
                Harvested = isFruit
                    ? [.. trees
                        .Where(tr => tr.HarvestId == harvest.Id && tr.HarvestedAmount > 0)
                        .Select(tr => GoodFromTreeProduce(tr.TreeStockId, tr.HarvestedAmount, treeStocks, treeProducts))
                        .OfType<ReportGood>()]
                    : [.. CropYield([.. results.Where(r => r.HarvestId == harvest.Id)])
                        .Select(yield => GoodFromTarget(yield.StockId, yield.TreeStockId, yield.Amount, string.Empty, stocks, treeStocks))
                        .OfType<ReportGood>()],
            });
        }

        return [.. rows.OrderBy(row => row.Title, StringComparer.CurrentCulture)];
    }

    /// <summary>
    /// A greenhouse harvest's counterpart to the crop branch of HarvestDayAsync — same shape,
    /// sourced from the greenhouse tables. IsFruit is always false: a greenhouse harvest's input
    /// is seed, never picked trees.
    /// </summary>
    private async Task<List<ReportDayHarvest>> GreenhouseHarvestDayAsync(DateOnly day)
    {
        var harvests = await context.GreenhouseHarvests.AsNoTracking()
            .Where(h => h.Status == HarvestStatus.Harvested && h.Date == day)
            .ToListAsync();
        if (harvests.Count == 0)
        {
            return [];
        }

        var ids = harvests.Select(h => h.Id).ToHashSet();
        var items = await context.GreenhouseHarvestItems.AsNoTracking().Where(i => ids.Contains(i.GreenhouseHarvestId)).ToListAsync();
        var results = await context.GreenhouseHarvestResults.AsNoTracking().Where(r => ids.Contains(r.GreenhouseHarvestId)).ToListAsync();
        var seeds = await context.GreenhouseHarvestSeeds.AsNoTracking().Where(s => ids.Contains(s.GreenhouseHarvestId)).ToListAsync();
        var chemicals = await context.GreenhouseHarvestChemicals.AsNoTracking().Where(c => ids.Contains(c.GreenhouseHarvestId)).ToListAsync();

        var stocks = await context.GreenhouseStocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);
        var seedRows = await context.GreenhouseSeeds.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);

        var rows = new List<ReportDayHarvest>();
        foreach (var harvest in harvests)
        {
            var revenue = harvest.Revenue ?? 0m;
            var expenses =
                (harvest.EquipmentCost ?? 0m) + (harvest.WorkersCost ?? 0m) + (harvest.FuelCost ?? 0m) + (harvest.OtherCost ?? 0m)
                + chemicals.Where(c => c.GreenhouseHarvestId == harvest.Id).Sum(c => c.Cost);

            rows.Add(new ReportDayHarvest
            {
                HarvestId = harvest.Id,
                Title = harvest.Title,
                IsFruit = false,
                Revenue = revenue,
                Expenses = expenses,
                Net = revenue - expenses,
                Planned = [.. items
                    .Where(i => i.GreenhouseHarvestId == harvest.Id)
                    .Select(i => GoodFromGreenhouseStock(i.GreenhouseStockId, i.Amount, i.Unit, stocks))
                    .OfType<ReportGood>()],
                Input = [.. seeds
                    .Where(s => s.GreenhouseHarvestId == harvest.Id)
                    .Select(s => GoodFromGreenhouseSeed(s.GreenhouseSeedId, s.Amount, seedRows))
                    .OfType<ReportGood>()],
                Harvested = [.. results
                    .Where(r => r.GreenhouseHarvestId == harvest.Id)
                    .Select(r => GoodFromGreenhouseStock(r.GreenhouseStockId, r.Amount, string.Empty, stocks))
                    .OfType<ReportGood>()],
            });
        }

        return [.. rows.OrderBy(row => row.Title, StringComparer.CurrentCulture)];
    }

    private static ReportGood? GoodFromGreenhouseStock(
        int stockId, decimal amount, string unitOverride, Dictionary<int, GreenhouseStock> stocks)
    {
        var stock = stocks.GetValueOrDefault(stockId);
        return stock is null
            ? null
            : new ReportGood
            {
                Name = stock.Name,
                TypeName = stock.Type,
                Kind = "stock",
                Amount = amount,
                Unit = string.IsNullOrWhiteSpace(unitOverride) ? stock.Unit.ToString() : unitOverride,
            };
    }

    private static ReportGood? GoodFromGreenhouseSeed(int seedId, decimal amount, Dictionary<int, GreenhouseSeed> seeds)
    {
        var seed = seeds.GetValueOrDefault(seedId);
        return seed is null
            ? null
            : new ReportGood
            {
                Name = seed.Name,
                TypeName = seed.Type,
                Kind = "seed",
                Amount = amount,
                Unit = seed.Unit.ToString(),
            };
    }

    /// <summary>
    /// Cell 4 is a slice of cell 2 — the same groups, read down one series. Deriving it from the
    /// same aggregation keeps the two panels from ever disagreeing about a number.
    /// </summary>
    public async Task<ReportSeriesDetails> GetSeriesDetailsAsync(ReportCategory category, ReportPeriod period, string seriesKey)
    {
        var overview = await GetOverviewAsync(category, period);

        var records = overview.Groups
            .Select(group => new ReportSeriesRecord
            {
                Label = group.Label,
                Day = group.Day,
                Amount = group.Values.GetValueOrDefault(seriesKey),
            })
            .Where(record => record.Amount > 0)
            .ToList();

        return new ReportSeriesDetails
        {
            Key = seriesKey,
            Total = records.Sum(record => record.Amount),
            Records = records,
        };
    }

    /// <summary>A planned or harvested row, which points at either a plant stock or an orchard.
    /// `unitOverride` carries a planned row's own unit, which may differ from the good's.</summary>
    private static ReportGood? GoodFromTarget(
        int? stockId,
        int? treeStockId,
        decimal amount,
        string unitOverride,
        Dictionary<int, Stock> stocks,
        Dictionary<int, TreeStock> treeStocks)
    {
        if (stockId is int id)
        {
            var stock = stocks.GetValueOrDefault(id);
            if (stock is null)
            {
                return null;
            }
            return new ReportGood
            {
                Name = stock.Name,
                TypeName = stock.Type,
                Kind = "stock",
                Amount = amount,
                Unit = string.IsNullOrWhiteSpace(unitOverride) ? stock.Unit.ToString() : unitOverride,
            };
        }

        if (treeStockId is int treeId)
        {
            var treeStock = treeStocks.GetValueOrDefault(treeId);
            if (treeStock is null)
            {
                return null;
            }
            return new ReportGood
            {
                Name = treeStock.Name,
                TypeName = treeStock.Type,
                Kind = "tree",
                Amount = amount,
                Unit = string.IsNullOrWhiteSpace(unitOverride) ? treeStock.Unit.ToString() : unitOverride,
            };
        }

        return null;
    }

    private static ReportGood? GoodFromTree(int treeStockId, decimal amount, Dictionary<int, TreeStock> treeStocks)
    {
        var treeStock = treeStocks.GetValueOrDefault(treeStockId);
        return treeStock is null
            ? null
            : new ReportGood
            {
                Name = treeStock.Name,
                TypeName = treeStock.Type,
                Kind = "tree",
                Amount = amount,
                Unit = treeStock.Unit.ToString(),
            };
    }

    /// <summary>Picked fruit reports as the produce its trees yield, when one is assigned.</summary>
    private static ReportGood? GoodFromTreeProduce(
        int treeStockId,
        decimal amount,
        Dictionary<int, TreeStock> treeStocks,
        Dictionary<int, TreeProduct> treeProducts)
    {
        var treeStock = treeStocks.GetValueOrDefault(treeStockId);
        if (treeStock is null)
        {
            return null;
        }

        var product = treeStock.TreeProductId is int productId ? treeProducts.GetValueOrDefault(productId) : null;
        return new ReportGood
        {
            Name = product?.Name ?? treeStock.Name,
            TypeName = treeStock.Type,
            Kind = product is null ? "tree" : "treeProduct",
            Amount = amount,
            Unit = product?.Unit.ToString() ?? treeStock.Unit.ToString(),
        };
    }

    private static ReportGood? GoodFromSeed(int seedId, decimal amount, Dictionary<int, Seed> seeds)
    {
        var seed = seeds.GetValueOrDefault(seedId);
        return seed is null
            ? null
            : new ReportGood
            {
                Name = seed.Name,
                TypeName = seed.Type,
                Kind = "seed",
                Amount = amount,
                Unit = seed.Unit.ToString(),
            };
    }
}
