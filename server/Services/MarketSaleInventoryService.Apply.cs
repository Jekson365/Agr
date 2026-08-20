using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public partial class MarketSaleInventoryService
{
    private async Task<MarketSaleInventoryResult> ApplyStockAsync(MarketOrder order)
    {
        var stock = await context.Stocks.FirstOrDefaultAsync(s => s.Id == order.SourceId);
        if (stock is null || stock.IsDeleted)
        {
            return MarketSaleInventoryResult.Nothing();
        }
        if (order.Quantity > stock.Amount)
        {
            return MarketSaleInventoryResult.NotEnough(stock.Amount);
        }

        stock.Amount -= order.Quantity;
        var movement = new StockMovement
        {
            StockId = stock.Id,
            Delta = -order.Quantity,
            Source = StockMovementSource.Market,
            MarketListingId = order.ListingId,
        };
        context.StockMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task<MarketSaleInventoryResult> ApplyTreeStockAsync(MarketOrder order)
    {
        var stock = await context.TreeStocks.FirstOrDefaultAsync(s => s.Id == order.SourceId);
        if (stock is null || stock.IsDeleted)
        {
            return MarketSaleInventoryResult.Nothing();
        }
        if (order.Quantity > stock.Amount)
        {
            return MarketSaleInventoryResult.NotEnough(stock.Amount);
        }

        stock.Amount -= order.Quantity;
        var movement = new TreeStockMovement
        {
            TreeStockId = stock.Id,
            Delta = -order.Quantity,
            Source = StockMovementSource.Market,
            MarketListingId = order.ListingId,
        };
        context.TreeStockMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task<MarketSaleInventoryResult> ApplyTreeProductAsync(MarketOrder order)
    {
        var product = await context.TreeProducts.FirstOrDefaultAsync(p => p.Id == order.SourceId);
        if (product is null)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        var balance = await TreeProductBalanceAsync(product.Id);
        if (order.Quantity > balance)
        {
            return MarketSaleInventoryResult.NotEnough(balance);
        }

        var movement = new TreeProductMovement
        {
            TreeProductId = product.Id,
            Delta = -order.Quantity,
            Source = TreeProductMovementSource.Market,
        };
        context.TreeProductMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task<MarketSaleInventoryResult> ApplyLivestockAsync(MarketOrder order)
    {
        var head = HeadCount(order.Quantity);
        if (head <= 0)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == order.SourceId);
        if (group is null || group.IsDeleted)
        {
            return MarketSaleInventoryResult.Nothing();
        }
        if (head > group.Count)
        {
            return MarketSaleInventoryResult.NotEnough(group.Count);
        }

        group.Count -= head;
        var movement = new LivestockMovement
        {
            LivestockId = group.Id,
            Delta = -head,
            Source = LivestockMovementSource.Market,
            Date = DateOnly.FromDateTime(order.PaidAt ?? order.CreatedAt),
            Note = BuyerNote(order),
        };
        context.LivestockMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task<MarketSaleInventoryResult> ApplyProductionAsync(MarketOrder order)
    {
        if (order.SourceUnitId is null)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        var balance = await ProductionBalanceAsync(order.SourceId!.Value, order.SourceUnitId.Value);
        if (order.Quantity > balance)
        {
            return MarketSaleInventoryResult.NotEnough(balance);
        }

        var movement = new ProductionMovement
        {
            ProductionTypeId = order.SourceId.Value,
            UnitId = order.SourceUnitId.Value,
            Delta = -order.Quantity,
            Source = ProductionMovementSource.Market,
            MarketListingId = order.ListingId,
        };
        context.ProductionMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task<MarketSaleInventoryResult> ApplyGreenhouseStockAsync(MarketOrder order)
    {
        var stock = await context.GreenhouseStocks.FirstOrDefaultAsync(s => s.Id == order.SourceId);
        if (stock is null)
        {
            return MarketSaleInventoryResult.Nothing();
        }
        if (order.Quantity > stock.Amount)
        {
            return MarketSaleInventoryResult.NotEnough(stock.Amount);
        }

        stock.Amount -= order.Quantity;
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(null);
    }
}
