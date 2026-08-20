using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public partial class MarketSaleInventoryService(AppDbContext context) : IMarketSaleInventoryService
{
    public async Task<MarketSaleInventoryResult> ApplyAsync(MarketOrder order)
    {
        if (order.StockAppliedAt is not null || order.SourceKind is null || order.SourceId is null)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        return order.SourceKind switch
        {
            ListingSourceKind.Stock => await ApplyStockAsync(order),
            ListingSourceKind.TreeStock => await ApplyTreeStockAsync(order),
            ListingSourceKind.TreeProduct => await ApplyTreeProductAsync(order),
            ListingSourceKind.Livestock => await ApplyLivestockAsync(order),
            ListingSourceKind.Production => await ApplyProductionAsync(order),
            ListingSourceKind.GreenhouseStock => await ApplyGreenhouseStockAsync(order),
            _ => MarketSaleInventoryResult.Nothing(),
        };
    }

    public async Task ReverseAsync(MarketOrder order)
    {
        if (order.StockAppliedAt is null || order.SourceKind is null || order.SourceId is null)
        {
            return;
        }

        switch (order.SourceKind)
        {
            case ListingSourceKind.Stock:
                await ReverseStockAsync(order);
                break;
            case ListingSourceKind.TreeStock:
                await ReverseTreeStockAsync(order);
                break;
            case ListingSourceKind.TreeProduct:
                await ReverseTreeProductAsync(order);
                break;
            case ListingSourceKind.Livestock:
                await ReverseLivestockAsync(order);
                break;
            case ListingSourceKind.Production:
                await ReverseProductionAsync(order);
                break;
            case ListingSourceKind.GreenhouseStock:
                await ReverseGreenhouseStockAsync(order);
                break;
        }
    }

    private async Task<decimal> ProductionBalanceAsync(int productionTypeId, int unitId)
    {
        var collected = await context.AnimalProductions
            .Where(p => p.ProductionTypeId == productionTypeId && p.UnitId == unitId)
            .SumAsync(p => (decimal?)p.Quantity) ?? 0m;

        var moved = await context.ProductionMovements
            .Where(m => m.ProductionTypeId == productionTypeId && m.UnitId == unitId)
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;

        return collected + moved;
    }

    private async Task<decimal> TreeProductBalanceAsync(int treeProductId)
    {
        return await context.TreeProductMovements
            .Where(m => m.TreeProductId == treeProductId)
            .SumAsync(m => (decimal?)m.Delta) ?? 0m;
    }

    private static int HeadCount(decimal quantity) => (int)decimal.Round(quantity, MidpointRounding.AwayFromZero);

    private static string? BuyerNote(MarketOrder order)
    {
        var buyer = $"{order.BuyerName} {order.BuyerSurname}".Trim();
        return string.IsNullOrEmpty(buyer) ? null : buyer;
    }
}
