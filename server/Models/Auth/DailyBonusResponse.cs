namespace Server.Models.Auth;

/// <summary>
/// The answer to claiming the daily sign-in bonus. It carries the whole user rather than just the
/// new balance, so the client can put its copy back in step in one go — the same shape sign-in
/// hands back. <see cref="Granted"/> is what tells today's first arrival from every one after it,
/// which is the only difference a client can show.
/// </summary>
public class DailyBonusResponse
{
    /// <summary>True only on the day's first claim; false means today's was already taken.</summary>
    public bool Granted { get; set; }

    /// <summary>What was just paid, or zero when nothing was.</summary>
    public int Amount { get; set; }

    /// <summary>The user as they now stand, balance included.</summary>
    public UserDto User { get; set; } = new();
}
