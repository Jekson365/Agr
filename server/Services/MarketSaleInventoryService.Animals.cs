using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Repositories;
using Server.Services.Interfaces;

namespace Server.Services;

public partial class MarketSaleInventoryService
{
    private static bool IsAnimalSale(MarketOrder order) =>
        order.SourceKind == ListingSourceKind.Livestock && order.SourceId is null;

    public async Task<bool> ReserveAnimalsAsync(int orderId, IReadOnlyCollection<int> animalIds)
    {
        var reserved = await LivestockSaleQueries.AvailableForSale(context)
            .Where(d => animalIds.Contains(d.Id))
            .ExecuteUpdateAsync(setters => setters.SetProperty(d => d.MarketOrderId, (int?)orderId));

        if (reserved == animalIds.Count)
        {
            return true;
        }

        await context.LivestockDetails
            .Where(d => d.MarketOrderId == orderId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(d => d.MarketOrderId, (int?)null));
        return false;
    }

    public async Task ReleaseAsync(MarketOrder order)
    {
        if (!IsAnimalSale(order))
        {
            return;
        }

        await context.LivestockDetails
            .Where(d => d.MarketOrderId == order.Id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(d => d.MarketOrderId, (int?)null)
                .SetProperty(d => d.SoldOn, (DateOnly?)null));
    }

    private async Task<MarketSaleInventoryResult> ApplyAnimalsAsync(MarketOrder order)
    {
        var animals = await context.LivestockDetails
            .Where(d => d.MarketOrderId == order.Id && d.SoldOn == null)
            .ToListAsync();
        if (animals.Count == 0)
        {
            return MarketSaleInventoryResult.Nothing();
        }

        var soldOn = DateOnly.FromDateTime(order.PaidAt ?? order.CreatedAt);
        foreach (var animal in animals)
        {
            animal.SoldOn = soldOn;
        }

        var heads = animals.GroupBy(a => a.LivestockId).ToDictionary(g => g.Key, g => g.Count());
        var groupIds = heads.Keys.ToList();
        var groups = await context.Livestock.Where(l => groupIds.Contains(l.Id)).ToListAsync();
        foreach (var group in groups)
        {
            var head = Math.Min(heads[group.Id], group.Count);
            if (group.IsDeleted || head <= 0)
            {
                continue;
            }

            group.Count -= head;
            context.LivestockMovements.Add(new LivestockMovement
            {
                LivestockId = group.Id,
                Delta = -head,
                Source = LivestockMovementSource.Market,
                Date = soldOn,
                Note = BuyerNote(order),
                MarketOrderId = order.Id,
            });
        }

        await context.SaveChangesAsync();
        return MarketSaleInventoryResult.Moved(null);
    }

    private async Task ReverseAnimalsAsync(MarketOrder order)
    {
        var movements = await context.LivestockMovements
            .Where(m => m.MarketOrderId == order.Id)
            .ToListAsync();
        var groupIds = movements.Select(m => m.LivestockId).Distinct().ToList();
        var groups = await context.Livestock
            .Where(l => groupIds.Contains(l.Id))
            .ToDictionaryAsync(l => l.Id);

        foreach (var movement in movements)
        {
            if (groups.TryGetValue(movement.LivestockId, out var group))
            {
                group.Count = Math.Max(0, group.Count - movement.Delta);
            }
        }
        context.LivestockMovements.RemoveRange(movements);

        var animals = await context.LivestockDetails
            .Where(d => d.MarketOrderId == order.Id)
            .ToListAsync();
        foreach (var animal in animals)
        {
            animal.SoldOn = null;
        }

        await context.SaveChangesAsync();
    }
}
