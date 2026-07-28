namespace Server.Models;

/// <summary>
/// Body of the marketplace sale endpoint for livestock production (POST /api/productionmovements/sale):
/// how much of a production type was sold, in which unit. A movement with a negative delta and
/// <see cref="ProductionMovementSource.Market"/> is logged against that type/unit balance.
/// </summary>
public record ProductionSaleRequest(int ProductionTypeId, int UnitId, decimal Quantity, int? MarketListingId = null);
