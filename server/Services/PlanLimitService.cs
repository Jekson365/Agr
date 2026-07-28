using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class PlanLimitService(MasterDbContext masterDb, ICurrentTenant currentTenant) : IPlanLimitService
{
    public Task EnsureCanAddLandAsync(int currentCount) =>
        EnsureUnderLimitAsync(currentCount, PlanLimits.MaxLand, LandLabel);

    public Task EnsureLandWithinLimitAsync(int currentCount) =>
        EnsureNotOverLimitAsync(currentCount, PlanLimits.MaxLand, LandLabel);

    public Task EnsureCanAddLivestockAsync(int currentCount) =>
        EnsureUnderLimitAsync(currentCount, PlanLimits.MaxLivestockKinds, LivestockLabel);

    public Task EnsureLivestockWithinLimitAsync(int currentCount) =>
        EnsureNotOverLimitAsync(currentCount, PlanLimits.MaxLivestockKinds, LivestockLabel);

    public Task EnsureCanAddStockAsync(int currentCount) =>
        EnsureUnderLimitAsync(currentCount, PlanLimits.MaxStockKinds, StockLabel);

    public Task EnsureStockWithinLimitAsync(int currentCount) =>
        EnsureNotOverLimitAsync(currentCount, PlanLimits.MaxStockKinds, StockLabel);

    public Task EnsureCanAddFruitAsync(int currentCount) =>
        EnsureUnderLimitAsync(currentCount, PlanLimits.MaxFruitKinds, FruitLabel);

    public Task EnsureFruitWithinLimitAsync(int currentCount) =>
        EnsureNotOverLimitAsync(currentCount, PlanLimits.MaxFruitKinds, FruitLabel);

    public async Task EnsureBalanceAllowedAsync()
    {
        var plan = await GetPlanAsync();
        if (!PlanLimits.BalanceAllowed(plan))
        {
            throw new InvalidOperationException(
                "Balance isn't available on your plan. Upgrade your plan to access it.");
        }
    }

    public async Task EnsureEquipmentAllowedAsync()
    {
        var plan = await GetPlanAsync();
        if (!PlanLimits.EquipmentAllowed(plan))
        {
            throw new InvalidOperationException(
                "Equipment isn't available on your plan. Upgrade your plan to access it.");
        }
    }

    public async Task EnsureCanScanAsync()
    {
        var user = await GetUserAsync();
        ResetScanCountIfNewDay(user);

        var limit = PlanLimits.MaxScansPerDay(user.Plan);
        if (limit is not null && user.ScanCount >= limit)
        {
            var plural = limit == 1 ? "scan" : "scans";
            throw new InvalidOperationException(
                $"Your {user.Plan} plan allows {limit} AI plant {plural} per day. Try again tomorrow or upgrade your plan.");
        }
    }

    public async Task RecordScanUsedAsync()
    {
        var user = await GetUserAsync();
        ResetScanCountIfNewDay(user);
        user.ScanCount += 1;
        await masterDb.SaveChangesAsync();
    }

    private static void ResetScanCountIfNewDay(User user)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (user.LastScanDate != today)
        {
            user.ScanCount = 0;
            user.LastScanDate = today;
        }
    }

    /* What each cap is called in the messages above. Both forms are spelled out because these
       don't pluralize by adding an "s" to the end: "kind of stock" → "kinds of stock". */
    private static readonly ResourceLabel LandLabel = new("land plot", "land plots");
    private static readonly ResourceLabel LivestockLabel = new("kind of livestock", "kinds of livestock");
    private static readonly ResourceLabel StockLabel = new("kind of stock", "kinds of stock");
    private static readonly ResourceLabel FruitLabel = new("kind of fruit", "kinds of fruit");

    private record ResourceLabel(string Singular, string Plural)
    {
        public string For(int count) => count == 1 ? Singular : Plural;
    }

    private async Task EnsureUnderLimitAsync(int currentCount, Func<StoragePlan, int?> limitFor, ResourceLabel label)
    {
        var plan = await GetPlanAsync();
        var limit = limitFor(plan);
        if (limit is not null && currentCount >= limit)
        {
            throw new InvalidOperationException(
                $"Your {plan} plan allows up to {limit} {label.For(limit.Value)}. Upgrade your plan to add more.");
        }
    }

    /// <summary>
    /// Guards edits rather than additions: only a count that has passed the cap is rejected, so
    /// being exactly full still leaves the existing rows editable.
    /// </summary>
    private async Task EnsureNotOverLimitAsync(int currentCount, Func<StoragePlan, int?> limitFor, ResourceLabel label)
    {
        var plan = await GetPlanAsync();
        var limit = limitFor(plan);
        if (limit is not null && currentCount > limit)
        {
            throw new InvalidOperationException(
                $"Your {plan} plan allows up to {limit} {label.For(limit.Value)}, but you have {currentCount}. " +
                "Remove the extra ones or upgrade your plan to keep editing.");
        }
    }

    private async Task<StoragePlan> GetPlanAsync() => (await GetUserAsync()).Plan;

    private async Task<User> GetUserAsync() =>
        await masterDb.Users.FindAsync(currentTenant.UserId)
            ?? throw new InvalidOperationException("User not found.");
}
