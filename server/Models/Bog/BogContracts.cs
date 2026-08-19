using System.Text.Json.Serialization;

namespace Server.Models.Bog;

/*
 * The wire shapes for Bank of Georgia's e-commerce API, kept in one file so the whole contract can
 * be checked against the bank's documentation in one sitting:
 * https://api.bog.ge/docs/en/payments/introduction
 *
 * These are written against BOG's published v1 payments contract. Confirm them against the current
 * docs and against the sandbox before taking real money — a field renamed at the bank is a payment
 * that silently stops working, and this is the one part of the app where being wrong costs money
 * rather than a rerender.
 */

/// <summary>What the token endpoint answers with for a client-credentials grant.</summary>
public class BogTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>Lifetime in seconds. Short — an hour or so — so the token is cached, not stored.</summary>
    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }
}

public class BogBasketItem
{
    [JsonPropertyName("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("unit_price")]
    public decimal UnitPrice { get; set; }
}

public class BogPurchaseUnits
{
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "GEL";

    [JsonPropertyName("total_amount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("basket")]
    public List<BogBasketItem> Basket { get; set; } = [];
}

public class BogRedirectUrls
{
    [JsonPropertyName("success")]
    public string Success { get; set; } = string.Empty;

    [JsonPropertyName("fail")]
    public string Fail { get; set; } = string.Empty;
}

public class BogCreateOrderRequest
{
    [JsonPropertyName("callback_url")]
    public string CallbackUrl { get; set; } = string.Empty;

    /// <summary>Our own order id, echoed back on the callback so the two can be matched.</summary>
    [JsonPropertyName("external_order_id")]
    public string ExternalOrderId { get; set; } = string.Empty;

    [JsonPropertyName("purchase_units")]
    public BogPurchaseUnits PurchaseUnits { get; set; } = new();

    [JsonPropertyName("redirect_urls")]
    public BogRedirectUrls RedirectUrls { get; set; } = new();
}

public class BogLink
{
    [JsonPropertyName("href")]
    public string Href { get; set; } = string.Empty;
}

public class BogLinks
{
    /// <summary>Where to send the buyer to pay.</summary>
    [JsonPropertyName("redirect")]
    public BogLink? Redirect { get; set; }
}

public class BogCreateOrderResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("_links")]
    public BogLinks? Links { get; set; }
}

/// <summary>The body the bank POSTs to the callback URL once a payment settles.</summary>
public class BogCallbackBody
{
    [JsonPropertyName("event")]
    public string? Event { get; set; }

    [JsonPropertyName("body")]
    public BogCallbackOrder? Body { get; set; }
}

public class BogCallbackOrder
{
    [JsonPropertyName("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("external_order_id")]
    public string? ExternalOrderId { get; set; }

    [JsonPropertyName("order_status")]
    public BogOrderStatus? OrderStatus { get; set; }
}

public class BogOrderStatus
{
    /// <summary>The machine-readable one. "completed" is the only value that means paid.</summary>
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string? Value { get; set; }
}
