namespace Server.Models;

public enum MarketOrderStatus
{
    /// <summary>Created here, but the buyer has not come back from the bank yet. Most orders that
    /// stay in this state are abandoned checkouts, not failures.</summary>
    Pending,

    /// <summary>The bank's callback said the money moved. This is the only status that may be
    /// treated as paid — never the browser coming back to the success URL, which is only where
    /// the buyer was sent and proves nothing.</summary>
    Paid,

    /// <summary>The bank told us the payment did not go through.</summary>
    Failed,

    /// <summary>Refunded after the fact, through the bank's own tooling.</summary>
    Refunded,
}

/// <summary>
/// One attempt to buy a <see cref="MarketListing"/> through Bank of Georgia.
///
/// Lives in the master database beside the listing it points at, for the same reason: a purchase
/// crosses two tenants (a buyer and a seller) and belongs to neither one's siloed database.
///
/// The buyer is captured as free text rather than as a user id. The marketplace is public and has
/// no sign-in, so whoever is buying is identified only by what they typed at checkout — which is
/// also the only way the seller can contact them afterwards.
/// </summary>
public class MarketOrder
{
    public int Id { get; set; }

    public int ListingId { get; set; }

    /// <summary>Who to hand the goods to, as typed at checkout.</summary>
    public string BuyerName { get; set; } = string.Empty;

    /// <summary>How the seller reaches the buyer. The only contact detail collected.</summary>
    public string BuyerPhone { get; set; } = string.Empty;

    /// <summary>How many units were bought, in the listing's own <c>PriceUnit</c>.</summary>
    public decimal Quantity { get; set; }

    /// <summary>
    /// What the buyer is charged, computed on the server from the listing's price. Never taken
    /// from the request body: a total the client can name is a total the client can choose.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>Prices across the app are entered and stored in GEL, so orders are too.</summary>
    public string Currency { get; set; } = "GEL";

    /// <summary>
    /// The commission rate this order was split at, stored rather than looked up. Changing the
    /// platform's rate later must not silently rewrite what past orders were divided at.
    /// </summary>
    public decimal CommissionRate { get; set; }

    /// <summary>The platform's cut of <see cref="Amount"/>. Always adds up with
    /// <see cref="SellerAmount"/> to exactly what the buyer paid.</summary>
    public decimal PlatformFee { get; set; }

    /// <summary>
    /// What the seller is owed. **A figure, not a payment.** Nothing in this app pays it out: the
    /// whole amount lands in the platform's own bank account, and settling up with the seller
    /// happens outside this system until real payouts are built.
    /// </summary>
    public decimal SellerAmount { get; set; }

    /// <summary>
    /// When the split was recorded against a paid order. Named "settled" for what it will mean
    /// once payouts are real; today it marks only that the division was worked out and logged.
    /// </summary>
    public DateTime? SettledAt { get; set; }

    public MarketOrderStatus Status { get; set; } = MarketOrderStatus.Pending;

    /// <summary>The bank's own id for this order, used to look the payment up again and to match
    /// its callback back to this row.</summary>
    public string? BogOrderId { get; set; }

    /// <summary>The bank's last word on this payment, kept verbatim for support and disputes —
    /// the reason a card was declined is not something to paraphrase into a status enum.</summary>
    public string? BogStatusDetail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the callback confirming payment arrived. Null until then.</summary>
    public DateTime? PaidAt { get; set; }
}
