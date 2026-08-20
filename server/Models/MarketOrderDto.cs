using System.ComponentModel.DataAnnotations;

namespace Server.Models;

/// <summary>What a buyer sends to start a checkout. Note what is absent: the price and the total.
/// Both are computed on the server from the listing, because a total the client can name is a
/// total the client can choose.</summary>
public class CreateMarketOrderRequest
{
    [Required]
    public int ListingId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string BuyerName { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string BuyerSurname { get; set; } = string.Empty;

    /// <summary>The seller's only way to reach the buyer, so it is required.</summary>
    [Required]
    [StringLength(32, MinimumLength = 5)]
    public string BuyerPhone { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string BuyerAddress { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string BuyerCity { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string BuyerVillage { get; set; } = string.Empty;

    [StringLength(300)]
    public string? BuyerFacebookUrl { get; set; }

    /// <summary>How many units, in the listing's own price unit. Must be positive.</summary>
    [Range(0.0001, 1_000_000)]
    public decimal Quantity { get; set; } = 1;
}

/// <summary>The answer to a checkout: where to send the buyer, and the order to come back to.</summary>
public class CreateMarketOrderResponse
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GEL";

    /// <summary>The bank's hosted payment page. The client navigates here; card details are only
    /// ever typed on the bank's own domain, never in this app.</summary>
    public string RedirectUrl { get; set; } = string.Empty;

    /// <summary>
    /// True when no bank was involved: the server has no merchant credentials, so the order was
    /// priced and split but nothing was charged, and <see cref="RedirectUrl"/> points back into
    /// this app rather than out to BOG. Lets the client say plainly that the sale was pretend.
    /// </summary>
    public bool Simulated { get; set; }
}

/// <summary>An order as the buyer may read it back. Deliberately thin — enough to show "paid" or
/// "not paid" on return from the bank, and nothing about the bank's internals.</summary>
public class MarketOrderDto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GEL";
    public MarketOrderStatus Status { get; set; }

    /// <summary>The rate this order was split at, as a fraction — 0.001 is 0.1%.</summary>
    public decimal CommissionRate { get; set; }
    public decimal PlatformFee { get; set; }

    /// <summary>What the seller is owed. Simulated: nothing pays it out.</summary>
    public decimal SellerAmount { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? SettledAt { get; set; }

    public static MarketOrderDto From(MarketOrder order) => new()
    {
        Id = order.Id,
        ListingId = order.ListingId,
        Quantity = order.Quantity,
        Amount = order.Amount,
        Currency = order.Currency,
        Status = order.Status,
        CommissionRate = order.CommissionRate,
        PlatformFee = order.PlatformFee,
        SellerAmount = order.SellerAmount,
        CreatedAt = order.CreatedAt,
        PaidAt = order.PaidAt,
        SettledAt = order.SettledAt,
    };
}
