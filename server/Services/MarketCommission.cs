namespace Server.Services;

/// <summary>
/// How a paid order is divided between the platform and the seller.
///
/// **Nothing here moves money.** It works out the two numbers and they are recorded on the order;
/// no payout is requested from anyone, and the seller's share exists only as a figure in our own
/// database. Paying sellers out for real is a separate piece of work — see the notes on
/// <see cref="Models.MarketOrder.SellerAmount"/>.
/// </summary>
public static class MarketCommission
{
    /// <summary>The platform's cut: 0.1% of what the buyer paid.</summary>
    public const decimal PlatformRate = 0.001m;

    /// <summary>
    /// Splits <paramref name="total"/> into the platform's fee and the seller's share.
    ///
    /// Only the fee is rounded; the seller's share is whatever is left after it. Rounding both
    /// independently is how a split ends up a tetri short of — or a tetri over — what the buyer
    /// actually paid, and money that does not add up is worse than money rounded unkindly.
    ///
    /// The fee rounds to the tetri, so at 0.1% an order under 5.00 GEL rounds to no fee at all.
    /// That is a real consequence of a rate this small with no minimum, not an oversight: if the
    /// platform should always take something, this is where a floor would go.
    /// </summary>
    public static (decimal PlatformFee, decimal SellerAmount) Split(decimal total)
    {
        if (total <= 0)
        {
            return (0m, 0m);
        }

        var fee = decimal.Round(total * PlatformRate, 2, MidpointRounding.AwayFromZero);

        // Defensive: a rate misconfigured above 100% must never leave the seller owing money.
        if (fee > total)
        {
            fee = total;
        }

        return (fee, total - fee);
    }
}
