using Server.Models;

namespace Server.Services.Interfaces;

public enum MarketSaleInventoryOutcome
{
    Applied,
    NothingToApply,
    Insufficient,
}

public class MarketSaleInventoryResult
{
    public MarketSaleInventoryOutcome Outcome { get; init; }

    public decimal Available { get; init; }

    public int? MovementId { get; init; }

    public static MarketSaleInventoryResult Nothing() =>
        new() { Outcome = MarketSaleInventoryOutcome.NothingToApply };

    public static MarketSaleInventoryResult NotEnough(decimal available) =>
        new() { Outcome = MarketSaleInventoryOutcome.Insufficient, Available = available };

    public static MarketSaleInventoryResult Moved(int? movementId) =>
        new() { Outcome = MarketSaleInventoryOutcome.Applied, MovementId = movementId };
}

public interface IMarketSaleInventoryService
{
    Task<MarketSaleInventoryResult> ApplyAsync(MarketOrder order);

    Task ReverseAsync(MarketOrder order);
}
