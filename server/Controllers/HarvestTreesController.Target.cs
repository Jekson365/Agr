using Server.Models;

namespace Server.Controllers;

public partial class HarvestTreesController
{
    private async Task<string?> TargetErrorAsync(Harvest harvest, HarvestTree harvestTree)
    {
        switch (harvest.Kind)
        {
            case HarvestKind.Fruit:
                return harvestTree.TreeStockId is null || harvestTree.StockId is not null
                    ? "A fruit harvest picks an orchard."
                    : null;
            case HarvestKind.Wine:
                if (harvestTree.StockId is not int stockId || harvestTree.TreeStockId is not null)
                {
                    return "A wine harvest picks a vineyard.";
                }
                var stock = await stockRepository.GetByIdAsync(stockId);
                return stock is null || stock.Category != StockCategory.Wine
                    ? "A wine harvest picks a vineyard."
                    : null;
            default:
                return "A crop harvest records its yield as results, not as picked plants.";
        }
    }
}
