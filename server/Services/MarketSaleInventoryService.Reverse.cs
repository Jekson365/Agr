using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Services;

public partial class MarketSaleInventoryService
{
    private async Task ReverseStockAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.StockMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        var stock = await context.Stocks.FirstOrDefaultAsync(s => s.Id == movement.StockId);
        if (stock is not null)
        {
            stock.Amount -= movement.Delta;
        }

        context.StockMovements.Remove(movement);
        await context.SaveChangesAsync();
    }

    private async Task ReverseTreeStockAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.TreeStockMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        var stock = await context.TreeStocks.FirstOrDefaultAsync(s => s.Id == movement.TreeStockId);
        if (stock is not null)
        {
            stock.Amount -= movement.Delta;
        }

        context.TreeStockMovements.Remove(movement);
        await context.SaveChangesAsync();
    }

    private async Task ReverseTreeProductAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.TreeProductMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        context.TreeProductMovements.Remove(movement);
        await context.SaveChangesAsync();
    }

    private async Task ReverseLivestockAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.LivestockMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == movement.LivestockId);
        if (group is not null)
        {
            group.Count = Math.Max(0, group.Count - movement.Delta);
        }

        context.LivestockMovements.Remove(movement);
        await context.SaveChangesAsync();
    }

    private async Task ReverseProductionAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.ProductionMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        context.ProductionMovements.Remove(movement);
        await context.SaveChangesAsync();
    }

    private async Task ReverseGreenhouseStockAsync(MarketOrder order)
    {
        var stock = await context.GreenhouseStocks.FirstOrDefaultAsync(s => s.Id == order.SourceId);
        if (stock is null)
        {
            return;
        }

        stock.Amount += order.Quantity;
        await context.SaveChangesAsync();
    }
}
