using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public partial class MarketSaleInventoryService
{
    private async Task<MarketSaleInventoryResult> ApplyWineAsync(MarketOrder order, bool bottles)
    {
        var batch = await context.WineBatches.FirstOrDefaultAsync(b => b.Id == order.SourceId);
        if (batch is null || batch.IsDeleted)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        var bottlingId = bottles
            ? await context.WineBottlings
                .Where(b => b.Id == order.SourceUnitId && b.WineBatchId == batch.Id)
                .Select(b => (int?)b.Id)
                .FirstOrDefaultAsync()
            : null;
        if (bottles && bottlingId is null)
        {
            return MarketSaleInventoryResult.NotEnough(0);
        }

        var rows = bottles
            ? context.WineMovements.Where(m => m.WineBottlingId == bottlingId)
            : context.WineMovements.Where(m => m.WineBatchId == batch.Id);
        decimal available = bottles
            ? await rows.SumAsync(m => (int?)m.BottleDelta) ?? 0
            : await rows.SumAsync(m => (decimal?)m.Delta) ?? 0m;
        if (order.Quantity > available || (bottles && order.Quantity != decimal.Truncate(order.Quantity)))
        {
            return MarketSaleInventoryResult.NotEnough(available);
        }

        var movement = new WineMovement
        {
            WineBatchId = batch.Id,
            Delta = bottles ? 0m : -order.Quantity,
            BottleDelta = bottles ? -(int)order.Quantity : 0,
            Source = WineMovementSource.Market,
            Date = DateOnly.FromDateTime(order.PaidAt ?? DateTime.UtcNow),
            MarketOrderId = order.Id > 0 ? order.Id : null,
            Revenue = order.Amount,
            WineBottlingId = bottlingId,
        };
        context.WineMovements.Add(movement);
        await context.SaveChangesAsync();

        return MarketSaleInventoryResult.Moved(movement.Id);
    }

    private async Task ReverseWineAsync(MarketOrder order)
    {
        var movement = order.StockMovementId is null
            ? null
            : await context.WineMovements.FirstOrDefaultAsync(m => m.Id == order.StockMovementId);
        if (movement is null)
        {
            return;
        }

        context.WineMovements.Remove(movement);
        await context.SaveChangesAsync();
    }
}
