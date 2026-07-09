using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models.Reports;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class ReportRepository(AppDbContext context) : IReportRepository
{
    public async Task<IEnumerable<StockMovementReportRow>> GetStockMovementReportAsync()
    {
        var stockRows = await (
            from movement in context.StockMovements.AsNoTracking()
            join stock in context.Stocks.AsNoTracking() on movement.StockId equals stock.Id
            select new StockMovementReportRow
            {
                Id = movement.Id,
                StockId = movement.StockId,
                Name = stock.Name,
                Type = stock.Type,
                Unit = stock.Unit.ToString(),
                Delta = movement.Delta,
                Source = movement.Source,
                CreatedAt = movement.CreatedAt,
            }).ToListAsync();

        var treeStockRows = await (
            from movement in context.TreeStockMovements.AsNoTracking()
            join treeStock in context.TreeStocks.AsNoTracking() on movement.TreeStockId equals treeStock.Id
            select new StockMovementReportRow
            {
                Id = movement.Id,
                TreeStockId = movement.TreeStockId,
                Name = treeStock.Name,
                Type = treeStock.Type,
                Unit = treeStock.Unit.ToString(),
                Delta = movement.Delta,
                Source = movement.Source,
                CreatedAt = movement.CreatedAt,
            }).ToListAsync();

        // Grouped by product (Stock or TreeStock id) so a product's movements stay together
        // instead of being interleaved with every other product's on the /farm/balance report;
        // newest movement first within each product's group. Stock and TreeStock ids come from
        // separate sequences and can collide numerically, so partition by kind first.
        return stockRows.Concat(treeStockRows)
            .OrderBy(r => r.TreeStockId.HasValue)
            .ThenBy(r => r.StockId ?? r.TreeStockId)
            .ThenByDescending(r => r.CreatedAt)
            .ToList();
    }
}
