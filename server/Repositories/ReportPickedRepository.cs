using Server.Models;
using Server.Models.Reports;

namespace Server.Repositories;

public partial class ReportRepository
{
    private static bool PicksPlants(ReportCategory category) =>
        category is ReportCategory.Fruit or ReportCategory.Wine;

    private static string? PickedKey(HarvestTree tree) =>
        tree.StockId is int stockId ? $"s{stockId}" : tree.TreeStockId is int treeStockId ? $"t{treeStockId}" : null;

    private static ReportSeries PickedSeries(
        string key,
        HarvestTree tree,
        Dictionary<int, Stock> stocks,
        Dictionary<int, TreeStock> treeStocks,
        Dictionary<int, TreeProduct> treeProducts)
    {
        if (tree.StockId is int stockId)
        {
            var series = StockSeries(key, stockId, stocks);
            series.Unit = nameof(StockUnit.Kilogram);
            return series;
        }
        return TreeSeries(key, tree.TreeStockId ?? 0, treeStocks, treeProducts);
    }

    private static ReportGood? PickedInput(
        HarvestTree tree,
        Dictionary<int, Stock> stocks,
        Dictionary<int, TreeStock> treeStocks)
    {
        return tree.StockId is int stockId
            ? GoodFromTarget(stockId, null, tree.Amount, string.Empty, stocks, treeStocks)
            : GoodFromTree(tree.TreeStockId ?? 0, tree.Amount, treeStocks);
    }

    private static ReportGood? PickedYield(
        HarvestTree tree,
        Dictionary<int, Stock> stocks,
        Dictionary<int, TreeStock> treeStocks,
        Dictionary<int, TreeProduct> treeProducts)
    {
        return tree.StockId is int stockId
            ? GoodFromTarget(stockId, null, tree.HarvestedAmount, nameof(StockUnit.Kilogram), stocks, treeStocks)
            : GoodFromTreeProduce(tree.TreeStockId ?? 0, tree.HarvestedAmount, treeStocks, treeProducts);
    }
}
