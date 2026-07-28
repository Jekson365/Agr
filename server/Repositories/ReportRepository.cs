using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Reports;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public partial class ReportRepository(AppDbContext context) : IReportRepository
{
    public async Task<IEnumerable<StockMovementReportRow>> GetStockMovementReportAsync()
    {
        // A harvest-sourced movement is owned by either the harvest item or the harvest result
        // that produced it, so its harvest is one hop further on. Both hops are resolved once
        // into lookups rather than joined per row.
        var titleByItemId = await (
            from item in context.HarvestItems.AsNoTracking()
            join harvest in context.Harvests.AsNoTracking() on item.HarvestId equals harvest.Id
            select new { item.Id, harvest.Title }).ToDictionaryAsync(x => x.Id, x => x.Title);

        var titleByResultId = await (
            from result in context.HarvestResults.AsNoTracking()
            join harvest in context.Harvests.AsNoTracking() on result.HarvestId equals harvest.Id
            select new { result.Id, harvest.Title }).ToDictionaryAsync(x => x.Id, x => x.Title);

        string? HarvestTitleFor(int? harvestItemId, int? harvestResultId)
        {
            if (harvestItemId is int itemId && titleByItemId.TryGetValue(itemId, out var fromItem))
            {
                return fromItem;
            }
            if (harvestResultId is int resultId && titleByResultId.TryGetValue(resultId, out var fromResult))
            {
                return fromResult;
            }
            return null;
        }

        var stockRows = await (
            from movement in context.StockMovements.AsNoTracking()
            join stock in context.Stocks.AsNoTracking() on movement.StockId equals stock.Id
            select new
            {
                Row = new StockMovementReportRow
                {
                    Id = movement.Id,
                    StockId = movement.StockId,
                    Name = stock.Name,
                    Type = stock.Type,
                    Unit = stock.Unit.ToString(),
                    Delta = movement.Delta,
                    Source = movement.Source,
                    CreatedAt = movement.CreatedAt,
                },
                movement.HarvestItemId,
                movement.HarvestResultId,
            }).ToListAsync();

        var treeStockRows = await (
            from movement in context.TreeStockMovements.AsNoTracking()
            join treeStock in context.TreeStocks.AsNoTracking() on movement.TreeStockId equals treeStock.Id
            select new
            {
                Row = new StockMovementReportRow
                {
                    Id = movement.Id,
                    TreeStockId = movement.TreeStockId,
                    Name = treeStock.Name,
                    Type = treeStock.Type,
                    Unit = treeStock.Unit.ToString(),
                    Delta = movement.Delta,
                    Source = movement.Source,
                    CreatedAt = movement.CreatedAt,
                },
                movement.HarvestItemId,
                movement.HarvestResultId,
            }).ToListAsync();

        foreach (var entry in stockRows.Concat(treeStockRows))
        {
            entry.Row.HarvestTitle = HarvestTitleFor(entry.HarvestItemId, entry.HarvestResultId);
        }

        // Grouped by product (Stock or TreeStock id) so a product's movements stay together
        // instead of being interleaved with every other product's on the /farm/balance report;
        // newest movement first within each product's group. Stock and TreeStock ids come from
        // separate sequences and can collide numerically, so partition by kind first.
        return stockRows.Concat(treeStockRows)
            .Select(entry => entry.Row)
            .OrderBy(r => r.TreeStockId.HasValue)
            .ThenBy(r => r.StockId ?? r.TreeStockId)
            .ThenByDescending(r => r.CreatedAt)
            .ToList();
    }
}
