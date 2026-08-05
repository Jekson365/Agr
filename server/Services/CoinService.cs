using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

/// <summary>
/// What coins are worth earning. Both bonuses are one-off by design, so each one is guarded by
/// something durable: the welcome bonus by a stamp on the user, a neighbourhood by its own award
/// row that outlives the link it was paid for.
/// </summary>
public class CoinService(MasterDbContext context) : ICoinService
{
    /// <summary>Paid once, the first time an account signs in.</summary>
    public const int WelcomeBonus = 50;

    /// <summary>Paid to both sides the first time a pair become neighbours.</summary>
    public const int NeighbourBonus = 100;

    /// <summary>Paid on the first arrival of each UTC day, every day.</summary>
    public const int DailyBonus = 10;

    public async Task<bool> GrantWelcomeBonusAsync(User user)
    {
        if (user.WelcomeBonusGrantedAt is not null)
        {
            return false;
        }

        user.Coins += WelcomeBonus;
        user.WelcomeBonusGrantedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> GrantNeighbourBonusAsync(int userId, int otherUserId)
    {
        var (firstId, secondId) = Pair(userId, otherUserId);

        if (await context.NeighbourCoinAwards.AnyAsync(a => a.UserAId == firstId && a.UserBId == secondId))
        {
            return false;
        }

        var pair = await context.Users.Where(u => u.Id == firstId || u.Id == secondId).ToListAsync();
        if (pair.Count != 2)
        {
            // One of them has just been deleted. The link is going with them, so there is nothing
            // to pay for.
            return false;
        }

        // Both of them gained a neighbour, so both are paid — in one transaction with the record
        // of it, which is what stops the pair ever being paid a second time.
        foreach (var user in pair)
        {
            user.Coins += NeighbourBonus;
        }

        var award = new NeighbourCoinAward { UserAId = firstId, UserBId = secondId };
        context.NeighbourCoinAwards.Add(award);

        try
        {
            await context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException)
        {
            // Two acceptances landing at the same moment: the unique index refuses the second, and
            // the coins roll back with it. Put the tracked entities back the way the database has
            // them, so a later save in this same request can't write the payment after all.
            context.Entry(award).State = EntityState.Detached;
            foreach (var user in pair)
            {
                await context.Entry(user).ReloadAsync();
            }
            return false;
        }
    }

    public async Task<bool> GrantDailyBonusAsync(User user)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // The common case by far — someone opening the app for the second time today — and it costs
        // nothing to answer from what is already loaded.
        if (user.LastDailyBonusOn == today)
        {
            return false;
        }

        // One conditional UPDATE rather than read-then-write. This bonus recurs, so unlike the two
        // above it has no award row to collide on; the day itself is the guard, and putting it in
        // the WHERE is what stops two arrivals at the same moment — an app opened in two tabs at
        // once — from each seeing yesterday's date and each paying.
        var paid = await context.Users
            .Where(u => u.Id == user.Id)
            .Where(u => u.LastDailyBonusOn == null || u.LastDailyBonusOn != today)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.Coins, u => u.Coins + DailyBonus)
                .SetProperty(u => u.LastDailyBonusOn, today));

        // That wrote straight past the change tracker, so the copy the caller is holding — and will
        // answer the request with — still shows yesterday's balance until it is read again.
        await context.Entry(user).ReloadAsync();

        return paid > 0;
    }

    /// <summary>The two ids, lowest first, so a pair reads the same from either side of it.</summary>
    private static (int FirstId, int SecondId) Pair(int userId, int otherUserId) =>
        userId < otherUserId ? (userId, otherUserId) : (otherUserId, userId);
}
