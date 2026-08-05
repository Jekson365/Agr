using Server.Models;

namespace Server.Services.Interfaces;

/// <summary>
/// Pays out coins, and remembers what it has already paid for. Every method is safe to call again:
/// a bonus that has been given once is never given twice, so callers can simply say what happened
/// rather than work out whether it counts.
/// </summary>
public interface ICoinService
{
    /// <summary>
    /// Pays the joining bonus the first time an account enters the system. The user must be tracked
    /// by this request's master context — the balance is updated on the instance passed in, so the
    /// caller can answer with it straight away. True when it paid, false when it already had.
    /// </summary>
    Task<bool> GrantWelcomeBonusAsync(User user);

    /// <summary>
    /// Pays both sides for becoming neighbours, once per pair for good. Call it after the link has
    /// been saved as accepted. True when it paid, false when that pair had already been paid.
    /// </summary>
    Task<bool> GrantNeighbourBonusAsync(int userId, int otherUserId);

    /// <summary>
    /// Pays the sign-in bonus, once per UTC calendar day and every day thereafter. Unlike the two
    /// above this one is meant to recur, so it is the caller's cheapest safeguard: call it on every
    /// arrival and it pays only on the first of the day. True when it paid, false when today's had
    /// already been taken. The balance on the instance passed in is brought up to date either way.
    /// </summary>
    Task<bool> GrantDailyBonusAsync(User user);
}
