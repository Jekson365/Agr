using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class MarketSaleDto
{
    public int Id { get; set; }
    public int? ListingId { get; set; }

    public bool IsManual { get; set; }

    public string ItemTitle { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public ListingCategory ItemCategory { get; set; }
    public string PriceUnit { get; set; } = string.Empty;
    public ListingSourceKind? SourceKind { get; set; }
    public int? SourceId { get; set; }
    public int? SourceUnitId { get; set; }

    public string BuyerName { get; set; } = string.Empty;
    public string BuyerSurname { get; set; } = string.Empty;
    public string BuyerPhone { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerCity { get; set; } = string.Empty;
    public string BuyerVillage { get; set; } = string.Empty;
    public string? BuyerFacebookUrl { get; set; }

    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GEL";
    public decimal SellerAmount { get; set; }

    public MarketOrderStatus PaymentStatus { get; set; }
    public MarketOrderFulfillment Fulfillment { get; set; }

    public bool StockApplied { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    public static MarketSaleDto From(MarketOrder order) => new()
    {
        Id = order.Id,
        ListingId = order.ListingId,
        IsManual = order.ListingId is null,
        ItemTitle = order.ItemTitle,
        ItemType = order.ItemType,
        ItemCategory = order.ItemCategory,
        PriceUnit = order.PriceUnit,
        SourceKind = order.SourceKind,
        SourceId = order.SourceId,
        SourceUnitId = order.SourceUnitId,
        BuyerName = order.BuyerName,
        BuyerSurname = order.BuyerSurname,
        BuyerPhone = order.BuyerPhone,
        BuyerAddress = order.BuyerAddress,
        BuyerCity = order.BuyerCity,
        BuyerVillage = order.BuyerVillage,
        BuyerFacebookUrl = order.BuyerFacebookUrl,
        Quantity = order.Quantity,
        Amount = order.Amount,
        Currency = order.Currency,
        SellerAmount = order.SellerAmount,
        PaymentStatus = order.Status,
        Fulfillment = order.Fulfillment,
        StockApplied = order.StockAppliedAt is not null,
        CreatedAt = order.CreatedAt,
        PaidAt = order.PaidAt,
    };
}

public class UpdateMarketSaleRequest
{
    public MarketOrderFulfillment Fulfillment { get; set; }
}

public class CreateManualSaleRequest
{
    public ListingSourceKind? SourceKind { get; set; }
    public int? SourceId { get; set; }
    public int? SourceUnitId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string ItemTitle { get; set; } = string.Empty;

    public string ItemType { get; set; } = string.Empty;
    public ListingCategory ItemCategory { get; set; } = ListingCategory.Other;
    public string PriceUnit { get; set; } = string.Empty;

    public decimal Quantity { get; set; }
    public decimal Price { get; set; }

    public DateOnly? SoldOn { get; set; }

    public string BuyerName { get; set; } = string.Empty;
    public string BuyerSurname { get; set; } = string.Empty;
    public string BuyerPhone { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerCity { get; set; } = string.Empty;
    public string BuyerVillage { get; set; } = string.Empty;
}
