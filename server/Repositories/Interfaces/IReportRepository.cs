using Server.Models.Reports;

namespace Server.Repositories.Interfaces;

public interface IReportRepository
{
    /// <summary>Every plant-stock and fruit-tree-stock movement joined with the product it
    /// belongs to, grouped by product with the newest movement first within each group.</summary>
    Task<IEnumerable<StockMovementReportRow>> GetStockMovementReportAsync();

    /// <summary>The report's value-over-time and per-series panels, totalled for one category and
    /// period.</summary>
    Task<ReportOverview> GetOverviewAsync(ReportCategory category, ReportPeriod period);

    /// <summary>What happened on one day — the panel a bar in the value chart opens.</summary>
    Task<ReportDayDetails> GetDayDetailsAsync(ReportCategory category, DateOnly day);

    /// <summary>Every record behind one series — the panel a bar in the grouped chart opens.</summary>
    Task<ReportSeriesDetails> GetSeriesDetailsAsync(ReportCategory category, ReportPeriod period, string seriesKey);
}
