namespace Server.Services.Interfaces;

/// <summary>
/// Enforces per-plan caps and feature gates (see <see cref="Models.PlanLimits"/>) against the
/// current request's user. Every method throws <see cref="InvalidOperationException"/> when the
/// action isn't allowed, matching the convention already used for storage-quota errors.
/// </summary>
public interface IPlanLimitService
{
    Task EnsureCanAddLandAsync(int currentCount);

    /// <summary>
    /// Throws when the user already holds more land than the plan allows — the state a downgrade
    /// leaves behind. Editing stays open while the count is still within the cap, so a user who is
    /// simply full (e.g. Free with their one land plot) can keep maintaining what they have.
    /// </summary>
    Task EnsureLandWithinLimitAsync(int currentCount);

    Task EnsureCanAddLivestockAsync(int currentCount);

    /// <summary>The <see cref="EnsureLandWithinLimitAsync"/> rule for kinds of livestock.</summary>
    Task EnsureLivestockWithinLimitAsync(int currentCount);
    Task EnsureCanAddStockAsync(int currentCount);

    /// <summary>The <see cref="EnsureLandWithinLimitAsync"/> rule for kinds of stock.</summary>
    Task EnsureStockWithinLimitAsync(int currentCount);
    Task EnsureCanAddFruitAsync(int currentCount);

    /// <summary>The <see cref="EnsureLandWithinLimitAsync"/> rule for kinds of fruit.</summary>
    Task EnsureFruitWithinLimitAsync(int currentCount);
    Task EnsureBalanceAllowedAsync();
    Task EnsureEquipmentAllowedAsync();

    /// <summary>Throws if the user has already used up today's AI plant-scan quota.</summary>
    Task EnsureCanScanAsync();

    /// <summary>Records that a scan was actually performed; call only after a successful scan.</summary>
    Task RecordScanUsedAsync();
}
