using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Reports;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <summary>
/// The aggregation behind the /report page. Everything the four panels draw is totalled here, so
/// the client fetches finished numbers instead of pulling every harvest, result and production
/// record down and summing them in the browser.
///
/// What is deliberately *not* done here is display text: labels come from the translation files
/// and icons from bundled artwork, both of which live on the client. Rows therefore carry the raw
/// names (a StockKind, a unit) and the client turns them into a label and an icon.
/// </summary>
public partial class ReportRepository
{
    /// <summary>The day a plain-date-in-a-timestamp column represents, read as its UTC date so it
    /// can't drift a day either way. Matches how the app stores collection dates.</summary>
    private static DateOnly DayOf(DateTime value) => DateOnly.FromDateTime(value.ToUniversalTime());

    private static string Iso(DateOnly day) => day.ToString("yyyy-MM-dd");

    /// <summary>What one production record was worth: the entered total, else quantity × unit price.</summary>
    private static decimal ValueOf(AnimalProduction record) =>
        record.TotalPrice ?? (record.PricePerUnit is decimal price ? record.Quantity * price : 0m);

    private static HarvestKind KindOf(ReportCategory category) =>
        category == ReportCategory.Fruit ? HarvestKind.Fruit : HarvestKind.Crop;

    public async Task<ReportOverview> GetOverviewAsync(ReportCategory category, ReportPeriod period)
    {
        return category switch
        {
            ReportCategory.Livestock => await LivestockOverviewAsync(period),
            ReportCategory.Greenhouse => await GreenhouseOverviewAsync(period),
            _ => await HarvestOverviewAsync(category, period),
        };
    }

    private async Task<ReportOverview> LivestockOverviewAsync(ReportPeriod period)
    {
        var records = await context.AnimalProductions.AsNoTracking().ToListAsync();
        var units = await context.Units.AsNoTracking().ToDictionaryAsync(u => u.Id, u => u);
        var types = await context.ProductionTypes.AsNoTracking().ToDictionaryAsync(pt => pt.Id, pt => pt);

        var overview = new ReportOverview();

        // Every type that has ever been collected stays selectable, so the series list doesn't
        // shuffle underneath the user as they move the period around.
        var seenSeries = new HashSet<string>();
        foreach (var record in records)
        {
            var key = $"pt{record.ProductionTypeId}";
            if (!seenSeries.Add(key))
            {
                continue;
            }
            overview.Series.Add(new ReportSeries
            {
                Key = key,
                TypeName = types.TryGetValue(record.ProductionTypeId, out var type) ? type.Name : string.Empty,
                Kind = "productionType",
                Unit = units.TryGetValue(record.UnitId, out var unit) ? unit.ShortName : string.Empty,
            });
        }

        var valueByDay = new SortedDictionary<string, decimal>(StringComparer.Ordinal);
        var groupsByDay = new SortedDictionary<string, Dictionary<string, decimal>>(StringComparer.Ordinal);

        foreach (var record in records)
        {
            var day = DayOf(record.CollectionDate);
            if (!period.Contains(day))
            {
                continue;
            }

            var iso = Iso(day);
            valueByDay[iso] = valueByDay.GetValueOrDefault(iso) + ValueOf(record);

            var values = groupsByDay.TryGetValue(iso, out var existing) ? existing : groupsByDay[iso] = [];
            var key = $"pt{record.ProductionTypeId}";
            values[key] = values.GetValueOrDefault(key) + record.Quantity;
        }

        overview.Value = [.. valueByDay.Select(pair => new ReportValuePoint { Day = pair.Key, Value = pair.Value })];
        overview.Groups = [.. groupsByDay.Select(pair => new ReportGroup { Day = pair.Key, Values = pair.Value })];
        return overview;
    }

    private async Task<ReportOverview> HarvestOverviewAsync(ReportCategory category, ReportPeriod period)
    {
        var kind = KindOf(category);
        var harvests = await context.Harvests.AsNoTracking()
            .Where(h => h.Kind == kind && h.Status == HarvestStatus.Harvested)
            .ToListAsync();
        var harvestIds = harvests.Select(h => h.Id).ToHashSet();

        var overview = new ReportOverview();
        if (harvestIds.Count == 0)
        {
            return overview;
        }

        // Fruit yield is recorded against the trees picked; a crop's against its results. What was
        // only planned counts for neither — see CropYield.
        var results = category == ReportCategory.Fruit
            ? []
            : await context.HarvestResults.AsNoTracking().Where(r => harvestIds.Contains(r.HarvestId)).ToListAsync();
        var trees = category == ReportCategory.Fruit
            ? await context.HarvestTrees.AsNoTracking().Where(tr => harvestIds.Contains(tr.HarvestId)).ToListAsync()
            : [];

        var stocks = await context.Stocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);
        var treeStocks = await context.TreeStocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);
        var treeProducts = await context.TreeProducts.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p);

        // What each crop harvest counts as having yielded, settled once and read by both the series
        // list and the per-harvest groups below, so the picker and the bars can't disagree.
        var yieldByHarvest = harvests.ToDictionary(
            harvest => harvest.Id,
            harvest => category == ReportCategory.Fruit
                ? []
                : CropYield([.. results.Where(r => r.HarvestId == harvest.Id)]));
        var treesByHarvest = trees.GroupBy(tr => tr.HarvestId).ToDictionary(g => g.Key, g => g.ToList());

        // The series list covers every harvest of this kind, not just the ones in the period —
        // narrowing the dates shouldn't empty the picker.
        var seenSeries = new HashSet<string>();
        foreach (var harvest in harvests)
        {
            if (category == ReportCategory.Fruit)
            {
                foreach (var tree in treesByHarvest.GetValueOrDefault(harvest.Id) ?? [])
                {
                    var key = $"t{tree.TreeStockId}";
                    if (!seenSeries.Add(key))
                    {
                        continue;
                    }
                    overview.Series.Add(TreeSeries(key, tree.TreeStockId, treeStocks, treeProducts));
                }
                continue;
            }

            foreach (var yield in yieldByHarvest.GetValueOrDefault(harvest.Id) ?? [])
            {
                var key = SeriesKey(yield.StockId, yield.TreeStockId);
                if (key is null || !seenSeries.Add(key))
                {
                    continue;
                }
                overview.Series.Add(yield.StockId is int stockId
                    ? StockSeries(key, stockId, stocks)
                    : TreeSeries(key, yield.TreeStockId!.Value, treeStocks, treeProducts));
            }
        }

        foreach (var harvest in harvests.Where(h => period.Contains(h.Date)).OrderBy(h => h.Date).ThenBy(h => h.Id))
        {
            var iso = Iso(harvest.Date);
            overview.Value.Add(new ReportValuePoint { Day = iso, Value = harvest.Revenue ?? 0m });

            var values = new Dictionary<string, decimal>();
            if (category == ReportCategory.Fruit)
            {
                foreach (var tree in treesByHarvest.GetValueOrDefault(harvest.Id) ?? [])
                {
                    var key = $"t{tree.TreeStockId}";
                    values[key] = values.GetValueOrDefault(key) + tree.HarvestedAmount;
                }
            }
            else
            {
                foreach (var yield in yieldByHarvest.GetValueOrDefault(harvest.Id) ?? [])
                {
                    var key = SeriesKey(yield.StockId, yield.TreeStockId);
                    if (key is null)
                    {
                        continue;
                    }
                    values[key] = values.GetValueOrDefault(key) + yield.Amount;
                }
            }

            // A harvest that produced nothing of any series would draw an empty group.
            if (values.Count == 0)
            {
                continue;
            }
            overview.Groups.Add(new ReportGroup { Day = iso, Label = harvest.Title, Values = values });
        }

        // One point per day, not per harvest: two harvests on the same date are one column.
        overview.Value = [.. overview.Value
            .GroupBy(point => point.Day)
            .OrderBy(g => g.Key, StringComparer.Ordinal)
            .Select(g => new ReportValuePoint { Day = g.Key, Value = g.Sum(point => point.Value) })];

        return overview;
    }

    /// <summary>
    /// A greenhouse harvest's counterpart to the crop branch of HarvestOverviewAsync — same shape,
    /// sourced from the greenhouse tables instead. There's no fruit/tree side and no HarvestKind
    /// to filter by: a greenhouse harvest is inherently one kind, and its yield always lands in
    /// GreenhouseStock.
    /// </summary>
    private async Task<ReportOverview> GreenhouseOverviewAsync(ReportPeriod period)
    {
        var harvests = await context.GreenhouseHarvests.AsNoTracking()
            .Where(h => h.Status == HarvestStatus.Harvested)
            .ToListAsync();
        var harvestIds = harvests.Select(h => h.Id).ToHashSet();

        var overview = new ReportOverview();
        if (harvestIds.Count == 0)
        {
            return overview;
        }

        var results = await context.GreenhouseHarvestResults.AsNoTracking()
            .Where(r => harvestIds.Contains(r.GreenhouseHarvestId)).ToListAsync();
        var stocks = await context.GreenhouseStocks.AsNoTracking().ToDictionaryAsync(s => s.Id, s => s);

        // The series list covers every harvest, not just the ones in the period — narrowing the
        // dates shouldn't empty the picker.
        var seenSeries = new HashSet<string>();
        foreach (var result in results)
        {
            var key = $"gs{result.GreenhouseStockId}";
            if (!seenSeries.Add(key))
            {
                continue;
            }
            overview.Series.Add(GreenhouseStockSeries(key, result.GreenhouseStockId, stocks));
        }

        var resultsByHarvest = results.GroupBy(r => r.GreenhouseHarvestId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var harvest in harvests.Where(h => period.Contains(h.Date)).OrderBy(h => h.Date).ThenBy(h => h.Id))
        {
            var iso = Iso(harvest.Date);
            overview.Value.Add(new ReportValuePoint { Day = iso, Value = harvest.Revenue ?? 0m });

            var values = new Dictionary<string, decimal>();
            foreach (var result in resultsByHarvest.GetValueOrDefault(harvest.Id) ?? [])
            {
                var key = $"gs{result.GreenhouseStockId}";
                values[key] = values.GetValueOrDefault(key) + result.Amount;
            }

            // A harvest that produced nothing of any series would draw an empty group.
            if (values.Count == 0)
            {
                continue;
            }
            overview.Groups.Add(new ReportGroup { Day = iso, Label = harvest.Title, Values = values });
        }

        // One point per day, not per harvest: two harvests on the same date are one column.
        overview.Value = [.. overview.Value
            .GroupBy(point => point.Day)
            .OrderBy(g => g.Key, StringComparer.Ordinal)
            .Select(g => new ReportValuePoint { Day = g.Key, Value = g.Sum(point => point.Value) })];

        return overview;
    }

    private static ReportSeries GreenhouseStockSeries(string key, int stockId, Dictionary<int, GreenhouseStock> stocks)
    {
        var stock = stocks.GetValueOrDefault(stockId);
        return new ReportSeries
        {
            Key = key,
            Name = stock?.Name ?? string.Empty,
            TypeName = stock?.Type ?? string.Empty,
            Kind = "stock",
            Unit = stock?.Unit.ToString() ?? string.Empty,
        };
    }

    private static string? SeriesKey(int? stockId, int? treeStockId) =>
        stockId is int s ? $"s{s}" : treeStockId is int t ? $"t{t}" : null;

    /// <summary>One good a harvest counts as having yielded, and how much of it.</summary>
    private readonly record struct HarvestYield(int? StockId, int? TreeStockId, decimal Amount);

    /// <summary>
    /// What a crop harvest is taken to have yielded, good by good: its recorded
    /// <see cref="HarvestResult"/> rows, and nothing else. A planned <see cref="HarvestItem"/> is a
    /// forecast, not a yield — the same rule HarvestStockSync follows when it puts the yield into
    /// stock, so the report and the stock ledger can never tell different stories about one
    /// harvest. A harvest that recorded no result reports no yield, however much it planned.
    /// </summary>
    private static List<HarvestYield> CropYield(List<HarvestResult> results)
    {
        return [.. results.Select(result => new HarvestYield(result.StockId, result.TreeStockId, result.Amount))];
    }

    private static ReportSeries StockSeries(string key, int stockId, Dictionary<int, Stock> stocks)
    {
        var stock = stocks.GetValueOrDefault(stockId);
        return new ReportSeries
        {
            Key = key,
            Name = stock?.Name ?? string.Empty,
            TypeName = stock?.Type ?? string.Empty,
            Kind = "stock",
            Unit = stock?.Unit.ToString() ?? string.Empty,
        };
    }

    /// <summary>A picked orchard reports as the produce it yields, falling back to the trees
    /// themselves when no product is assigned.</summary>
    private static ReportSeries TreeSeries(
        string key,
        int treeStockId,
        Dictionary<int, TreeStock> treeStocks,
        Dictionary<int, TreeProduct> treeProducts)
    {
        var treeStock = treeStocks.GetValueOrDefault(treeStockId);
        var product = treeStock?.TreeProductId is int productId ? treeProducts.GetValueOrDefault(productId) : null;
        return new ReportSeries
        {
            Key = key,
            Name = product?.Name ?? treeStock?.Name ?? string.Empty,
            TypeName = treeStock?.Type ?? string.Empty,
            Kind = product is null ? "tree" : "treeProduct",
            Unit = product?.Unit.ToString() ?? treeStock?.Unit.ToString() ?? string.Empty,
        };
    }
}
