using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Controllers;

public partial class MarketSalesController
{
    private async Task<ActionResult<MarketSaleDto>> RecordAnimalSaleAsync(MarketOrder order, IReadOnlyCollection<int> animalIds)
    {
        context.MarketOrders.Add(order);
        await context.SaveChangesAsync();

        if (!await inventory.ReserveAnimalsAsync(order.Id, animalIds))
        {
            context.MarketOrders.Remove(order);
            await context.SaveChangesAsync();
            return Conflict("Some of these animals are no longer available to sell.");
        }

        var result = await inventory.ApplyAsync(order);
        if (result.Outcome == MarketSaleInventoryOutcome.Applied)
        {
            order.StockAppliedAt = DateTime.UtcNow;
            order.StockMovementId = result.MovementId;
            await context.SaveChangesAsync();
        }

        return Ok(MarketSaleDto.From(order));
    }
}
