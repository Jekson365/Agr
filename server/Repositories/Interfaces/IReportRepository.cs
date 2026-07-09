using Server.Models.Reports;

namespace Server.Repositories.Interfaces;

public interface IReportRepository
{
    /// <summary>Every plant-stock and fruit-tree-stock movement joined with the product it
    /// belongs to, grouped by product with the newest movement first within each group.</summary>
    Task<IEnumerable<StockMovementReportRow>> GetStockMovementReportAsync();
}
