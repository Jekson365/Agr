using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;

namespace Server.Controllers;

public partial class MarketSalesController
{
    [HttpPost("manual")]
    public async Task<ActionResult<MarketSaleDto>> CreateManual(CreateManualSaleRequest request)
    {
        var sellerId = currentTenant.UserId;
        if (sellerId == 0)
        {
            return Unauthorized();
        }

        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }
        if (request.Price < 0)
        {
            return BadRequest("Price cannot be negative.");
        }

        var soldAt = MarketSalesPeriod.StartOfDayUtc(request.SoldOn ?? DateOnly.FromDateTime(DateTime.UtcNow));
        var amount = decimal.Round(request.Price * request.Quantity, 2);

        var order = new MarketOrder
        {
            ListingId = null,
            SellerId = sellerId,
            ItemTitle = request.ItemTitle.Trim(),
            ItemType = request.ItemType.Trim(),
            ItemCategory = request.ItemCategory,
            PriceUnit = request.PriceUnit.Trim(),
            SourceKind = request.SourceKind,
            SourceId = request.SourceId,
            SourceUnitId = request.SourceUnitId,
            BuyerName = request.BuyerName.Trim(),
            BuyerSurname = request.BuyerSurname.Trim(),
            BuyerPhone = request.BuyerPhone.Trim(),
            BuyerAddress = request.BuyerAddress.Trim(),
            BuyerCity = request.BuyerCity.Trim(),
            BuyerVillage = request.BuyerVillage.Trim(),
            Quantity = request.Quantity,
            Amount = amount,
            Currency = "GEL",
            CommissionRate = 0m,
            PlatformFee = 0m,
            SellerAmount = amount,
            Status = MarketOrderStatus.Manual,
            Fulfillment = MarketOrderFulfillment.Sold,
            CreatedAt = soldAt,
            PaidAt = soldAt,
        };

        var result = await inventory.ApplyAsync(order);
        if (result.Outcome == MarketSaleInventoryOutcome.Insufficient)
        {
            return Conflict($"Only {result.Available} is available to sell.");
        }
        if (result.Outcome == MarketSaleInventoryOutcome.Applied)
        {
            order.StockAppliedAt = DateTime.UtcNow;
            order.StockMovementId = result.MovementId;
        }

        context.MarketOrders.Add(order);
        await context.SaveChangesAsync();

        return Ok(MarketSaleDto.From(order));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sellerId = currentTenant.UserId;
        if (sellerId == 0)
        {
            return Unauthorized();
        }

        var order = await context.MarketOrders.FirstOrDefaultAsync(o => o.Id == id);
        if (order is null)
        {
            return NotFound();
        }
        if (order.SellerId != sellerId)
        {
            return Forbid();
        }
        if (order.ListingId is not null)
        {
            return Conflict("Only a sale recorded by hand can be deleted.");
        }

        await inventory.ReverseAsync(order);

        context.MarketOrders.Remove(order);
        await context.SaveChangesAsync();

        return NoContent();
    }
}
