namespace Server.Services.Interfaces;

/// <summary>Why a request for a code was not granted.</summary>
public enum SendCodeStatus
{
    /// <summary>The message was handed to the SMS provider.</summary>
    Sent,

    /// <summary>A code went to this number moments ago; wait before asking for another.</summary>
    TooSoon,

    /// <summary>This number has had its allowance of codes for the hour.</summary>
    TooMany,

    /// <summary>The SMS provider refused it or could not be reached.</summary>
    SendFailed,
}

/// <param name="Status">What happened.</param>
/// <param name="RetryAfterSeconds">How long until asking again could succeed. Zero when it just did.</param>
/// <param name="ExpiresInSeconds">How long the code that was just sent is good for.</param>
public record SendCodeResult(SendCodeStatus Status, int RetryAfterSeconds, int ExpiresInSeconds);

/// <summary>
/// Issues and checks the one-time codes that prove somebody is holding a phone. Nothing here
/// decides what a proven number is *for* — that is the caller's business.
/// </summary>
public interface IPhoneVerificationService
{
    /// <summary>
    /// Texts a fresh code to <paramref name="phoneNumber"/> (E.164), retiring any code that number
    /// still had outstanding. Refuses rather than throws when the number is asking too often.
    /// </summary>
    Task<SendCodeResult> SendAsync(string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// True when <paramref name="code"/> is the code that number is currently waiting on, which it
    /// then spends — a code proves one thing, once. A wrong guess counts against the code and kills
    /// it after a few, so the six digits cannot simply be enumerated.
    /// </summary>
    Task<bool> TryConsumeAsync(string phoneNumber, string code);
}
