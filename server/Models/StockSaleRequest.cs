namespace Server.Models;

/// <summary>
/// Body of the "record a marketplace sale" endpoints (POST /api/stocks/{id}/sale and
/// /api/treestocks/{id}/sale): how much of the stock was sold. The amount is deducted and a
/// movement with <see cref="StockMovementSource.Market"/> is logged.
/// </summary>
public record StockSaleRequest(decimal Quantity, int? MarketListingId = null);
