using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Data;
using Server.Models;
using Server.Models.Bog;
using Server.Services;
using Server.Services.Interfaces;

namespace Server.Controllers;

/// <summary>
/// Buying a listing through Bank of Georgia.
///
/// Anonymous throughout, like the market it serves: the buyer identifies themselves by typing a
/// name and a phone number at checkout, and nothing here reads the tenant database, so there is no
/// tenant to resolve. Like <see cref="MarketListingsController"/>, this controller works entirely
/// against <see cref="MasterDbContext"/>.
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("api/[controller]")]
public class MarketOrdersController(
    MasterDbContext context,
    IBogPaymentService bogPaymentService,
    IOptions<BogOptions> bogOptions,
    IHostEnvironment environment,
    ILogger<MarketOrdersController> logger)
    : ControllerBase
{
    /// <summary>
    /// Whether this server may pretend a payment happened.
    ///
    /// Both conditions matter. No merchant credentials is not on its own a safe test for
    /// "nobody is watching": a production box whose BOG settings have not been filled in yet is
    /// exactly that, and there the simulated endpoints are a public way for a stranger to mark
    /// other people's listings sold and empty their stock. So simulation additionally requires a
    /// development environment, and production without credentials simply cannot take payments.
    /// </summary>
    private bool SimulationAllowed => !bogPaymentService.IsConfigured && environment.IsDevelopment();
    /// <summary>
    /// Starts a checkout: prices it from the listing, records a pending order, registers it with
    /// the bank, and answers with the page to send the buyer to.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CreateMarketOrderResponse>> Create(CreateMarketOrderRequest request)
    {
        if (!bogPaymentService.IsConfigured && !SimulationAllowed)
        {
            // A production server with no merchant credentials. It cannot charge anyone, and it
            // must not pretend to, so it says so plainly rather than failing at the bank.
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Card payment is not configured on this server.");
        }

        var listing = await context.MarketListings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == request.ListingId);
        if (listing is null)
        {
            return NotFound();
        }
        if (listing.Status != ListingStatus.Active)
        {
            return Conflict("That listing is no longer for sale.");
        }

        // Rentals are arranged with the seller — dates, deposit, handover — none of which a single
        // card charge captures. The marketplace hides the buy button on these, and this is what
        // makes that a rule rather than a hidden button: the endpoint is public and anyone can
        // POST at it with any listing id.
        if (listing.Type == ListingType.Rent)
        {
            return Conflict("Rentals are arranged with the seller, not bought online.");
        }

        // Never buy more than is on offer. A listing without a quantity is one the seller did not
        // count — those are sold as a single lot.
        var quantity = listing.Quantity is null ? 1m : request.Quantity;
        if (listing.Quantity is not null && quantity > listing.Quantity)
        {
            return Conflict("There is not that much left.");
        }

        // Priced here, from the listing. The request carries no amount at all.
        var amount = decimal.Round(listing.Price * quantity, 2);
        if (amount <= 0)
        {
            return Conflict("That listing has no price to charge.");
        }

        // Worked out up front, so what the platform and the seller are each due is on record from
        // the moment the order exists rather than only once it is paid.
        var (platformFee, sellerAmount) = MarketCommission.Split(amount);

        var order = new MarketOrder
        {
            ListingId = listing.Id,
            BuyerName = request.BuyerName.Trim(),
            BuyerPhone = request.BuyerPhone.Trim(),
            Quantity = quantity,
            Amount = amount,
            Currency = "GEL",
            Status = MarketOrderStatus.Pending,
            CommissionRate = MarketCommission.PlatformRate,
            PlatformFee = platformFee,
            SellerAmount = sellerAmount,
        };

        // Saved before the bank is called, so the id exists to send as external_order_id — which
        // is what the callback will use to find this row again.
        context.MarketOrders.Add(order);
        await context.SaveChangesAsync();

        // Development without merchant credentials: price it, split it, and send the buyer back
        // into this app instead of out to a bank. Nothing is charged and nothing is paid out — the
        // point is that the rest of the flow, commission included, can be walked through before
        // BOG is real.
        if (SimulationAllowed)
        {
            logger.LogInformation(
                "SIMULATED checkout for order {OrderId}: no BOG credentials configured, so nothing was charged.",
                order.Id);

            return Ok(new CreateMarketOrderResponse
            {
                OrderId = order.Id,
                Amount = order.Amount,
                Currency = order.Currency,
                RedirectUrl = $"{bogOptions.Value.SuccessUrl}?order={order.Id}&simulate=1",
                Simulated = true,
            });
        }

        try
        {
            var (bogOrderId, redirectUrl) = await bogPaymentService.CreateOrderAsync(order, listing);
            order.BogOrderId = bogOrderId;
            await context.SaveChangesAsync();

            return Ok(new CreateMarketOrderResponse
            {
                OrderId = order.Id,
                Amount = order.Amount,
                Currency = order.Currency,
                RedirectUrl = redirectUrl,
            });
        }
        catch (Exception ex)
        {
            // The row stays, marked failed: an order the bank never accepted is still worth being
            // able to look at when someone asks why their payment did not start.
            logger.LogError(ex, "Could not start a BOG payment for order {OrderId}", order.Id);
            order.Status = MarketOrderStatus.Failed;
            order.BogStatusDetail = ex.Message;
            await context.SaveChangesAsync();
            return StatusCode(StatusCodes.Status502BadGateway, "Could not start the payment.");
        }
    }

    /// <summary>
    /// Where the bank reports what happened. **This is the only thing that may mark an order
    /// paid** — the buyer's browser arriving at the success URL proves only that it was sent
    /// there, and anyone can type that address.
    /// </summary>
    [HttpPost("callback")]
    public async Task<IActionResult> Callback()
    {
        // Read verbatim: the signature is over the exact bytes sent, so re-serializing a parsed
        // object would check a signature against a body the bank never sent.
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync();
        Request.Body.Position = 0;

        var signature = Request.Headers["Callback-Signature"].FirstOrDefault();
        if (!bogPaymentService.VerifyCallbackSignature(rawBody, signature))
        {
            logger.LogWarning("Discarded a BOG callback that failed signature verification.");
            return Unauthorized();
        }

        BogCallbackBody? callback;
        try
        {
            callback = System.Text.Json.JsonSerializer.Deserialize<BogCallbackBody>(rawBody);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not read a BOG callback body.");
            return BadRequest();
        }

        var body = callback?.Body;
        if (body is null || !int.TryParse(body.ExternalOrderId, out var orderId))
        {
            logger.LogWarning("A BOG callback carried no usable external_order_id.");
            return BadRequest();
        }

        var order = await context.MarketOrders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order is null)
        {
            logger.LogWarning("A BOG callback named order {OrderId}, which does not exist.", orderId);
            return NotFound();
        }

        // Callbacks can arrive more than once for the same order; settling one twice must not undo
        // it or double anything, so an order already settled is acknowledged and left alone.
        if (order.Status is MarketOrderStatus.Paid or MarketOrderStatus.Refunded)
        {
            return Ok();
        }

        var statusKey = body.OrderStatus?.Key ?? string.Empty;
        order.BogOrderId = body.OrderId;
        order.BogStatusDetail = body.OrderStatus?.Value ?? statusKey;

        if (string.Equals(statusKey, "completed", StringComparison.OrdinalIgnoreCase))
        {
            order.Status = MarketOrderStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            await ApplyPaidQuantityAsync(order);
            RecordSimulatedSettlement(order);
        }
        else
        {
            order.Status = MarketOrderStatus.Failed;
        }

        await context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Takes what was bought off the listing, and closes it once nothing is left. Mirrors what the
    /// seller's own "mark sold" does in the web app, so a listing that sells itself online ends up
    /// in the same state as one sold by hand.
    /// </summary>
    private async Task ApplyPaidQuantityAsync(MarketOrder order)
    {
        var listing = await context.MarketListings.FirstOrDefaultAsync(l => l.Id == order.ListingId);
        if (listing is null)
        {
            return;
        }

        if (listing.Quantity is null)
        {
            // An uncounted listing is a single lot, so paying for it completes it outright.
            listing.Status = ListingStatus.Completed;
            return;
        }

        var remaining = listing.Quantity.Value - order.Quantity;
        listing.Quantity = remaining > 0 ? remaining : 0;
        if (remaining <= 0)
        {
            listing.Status = ListingStatus.Completed;
        }
    }

    /// <summary>
    /// Divides a paid order between the platform and the seller — on paper.
    ///
    /// **No money moves.** The buyer's whole payment is already sitting in the platform's own bank
    /// account; this writes down how much of it belongs to the seller and stamps the order as
    /// worked out. Paying that share over is not implemented, and cannot be until either BOG split
    /// payments are set up per seller or someone transfers it by hand.
    ///
    /// The rate is re-read from the order rather than from the constant, so an order created under
    /// an older rate settles at the rate it was sold under.
    /// </summary>
    private void RecordSimulatedSettlement(MarketOrder order)
    {
        order.SettledAt = DateTime.UtcNow;

        logger.LogInformation(
            "SIMULATED settlement for order {OrderId}: buyer paid {Amount} {Currency}; platform fee {Fee} at {Rate:P3}; seller is owed {Seller} (not paid out).",
            order.Id, order.Amount, order.Currency, order.PlatformFee, order.CommissionRate, order.SellerAmount);
    }

    /// <summary>
    /// Marks an order paid without a bank, so the whole flow — quantity coming off the listing, the
    /// commission split, the return page — can be exercised end to end.
    ///
    /// **Development only, and only without merchant credentials.** An endpoint that declares any
    /// order paid — decrementing real listings and completing them — is exactly what must never be
    /// reachable in production, so it disables itself rather than relying on anyone remembering to
    /// remove it. See <see cref="SimulationAllowed"/>.
    /// </summary>
    [HttpPost("{id:int}/simulate-payment")]
    public async Task<ActionResult<MarketOrderDto>> SimulatePayment(int id)
    {
        if (!SimulationAllowed)
        {
            return NotFound();
        }

        var order = await context.MarketOrders.FirstOrDefaultAsync(o => o.Id == id);
        if (order is null)
        {
            return NotFound();
        }
        if (order.Status == MarketOrderStatus.Paid)
        {
            return Ok(MarketOrderDto.From(order));
        }

        order.Status = MarketOrderStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        order.BogStatusDetail = "simulated";
        await ApplyPaidQuantityAsync(order);
        RecordSimulatedSettlement(order);
        await context.SaveChangesAsync();

        return Ok(MarketOrderDto.From(order));
    }

    /// <summary>
    /// Reads one order back, so the page the buyer lands on after paying can say whether the money
    /// actually arrived rather than trusting which URL it was sent to.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<MarketOrderDto>> GetById(int id)
    {
        var order = await context.MarketOrders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id);
        return order is null ? NotFound() : Ok(MarketOrderDto.From(order));
    }
}
