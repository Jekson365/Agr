using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public partial class MarketSalesController(
    MasterDbContext context,
    ICurrentTenant currentTenant,
    IMarketSaleInventoryService inventory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MarketSaleDto>>> GetMine(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var sellerId = currentTenant.UserId;
        if (sellerId == 0)
        {
            return Unauthorized();
        }

        var query = context.MarketOrders.AsNoTracking().Where(o => o.SellerId == sellerId);

        if (from is not null)
        {
            var start = MarketSalesPeriod.StartOfDayUtc(from.Value);
            query = query.Where(o => o.CreatedAt >= start);
        }
        if (to is not null)
        {
            var end = MarketSalesPeriod.EndExclusiveUtc(to.Value);
            query = query.Where(o => o.CreatedAt < end);
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders.Select(MarketSaleDto.From));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<MarketSalesSummaryDto>> GetSummary(
        [FromQuery] SalesPeriodMode period = SalesPeriodMode.Month,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null)
    {
        var sellerId = currentTenant.UserId;
        if (sellerId == 0)
        {
            return Unauthorized();
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (start, end, unit) = MarketSalesPeriod.Window(period, today, from, to);

        var rangeStart = MarketSalesPeriod.StartOfDayUtc(start);
        var rangeEnd = MarketSalesPeriod.EndExclusiveUtc(end);

        var placed = await context.MarketOrders
            .AsNoTracking()
            .Where(o => o.SellerId == sellerId && o.CreatedAt >= rangeStart && o.CreatedAt < rangeEnd)
            .Select(o => new { o.CreatedAt, o.Amount })
            .ToListAsync();

        var totals = new Dictionary<DateOnly, (decimal Total, int Count)>();
        for (var cursor = MarketSalesPeriod.BucketStart(start, unit);
             cursor <= MarketSalesPeriod.BucketStart(end, unit);
             cursor = MarketSalesPeriod.AddUnits(cursor, unit, 1))
        {
            totals[cursor] = (0m, 0);
        }

        foreach (var row in placed)
        {
            var key = MarketSalesPeriod.BucketStart(DateOnly.FromDateTime(row.CreatedAt), unit);
            if (totals.TryGetValue(key, out var current))
            {
                totals[key] = (current.Total + row.Amount, current.Count + 1);
            }
        }

        return Ok(new MarketSalesSummaryDto
        {
            Unit = unit,
            From = start,
            To = end,
            Buckets = [.. totals
                .OrderBy(pair => pair.Key)
                .Select(pair => new MarketSalesBucketDto
                {
                    Start = pair.Key,
                    Total = pair.Value.Total,
                    Count = pair.Value.Count,
                })],
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MarketSaleDto>> Update(int id, UpdateMarketSaleRequest request)
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

        if (order.Fulfillment == request.Fulfillment)
        {
            return Ok(MarketSaleDto.From(order));
        }

        if (request.Fulfillment == MarketOrderFulfillment.Sold)
        {
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
        }
        else
        {
            await inventory.ReverseAsync(order);
            order.StockAppliedAt = null;
            order.StockMovementId = null;
        }

        order.Fulfillment = request.Fulfillment;
        await context.SaveChangesAsync();

        return Ok(MarketSaleDto.From(order));
    }
}
