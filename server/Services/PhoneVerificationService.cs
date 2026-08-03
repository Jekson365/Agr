using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Integrations.SmsService;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

/// <summary>
/// The one-time codes behind registering by phone. Every limit here exists because each message
/// costs money and lands on somebody's phone: without them a stranger's number could be used as a
/// free bell to ring, and six digits could be guessed through in an afternoon.
/// </summary>
public class PhoneVerificationService(
    MasterDbContext context,
    ISmsSender sms,
    ILogger<PhoneVerificationService> logger) : IPhoneVerificationService
{
    /// <summary>Long enough not to be guessed inside the attempt limit, short enough to be typed.</summary>
    public const int CodeLength = 6;

    /// <summary>Long enough to fetch the phone from the next room, short enough to be worth little later.</summary>
    public static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);

    /// <summary>Time before the same number may ask for another code.</summary>
    public static readonly TimeSpan ResendInterval = TimeSpan.FromSeconds(60);

    /// <summary>How many codes one number may be sent in a rolling hour.</summary>
    public const int MaxPerHour = 5;

    /// <summary>Wrong guesses a single code survives.</summary>
    public const int MaxAttempts = 5;

    private static readonly TimeSpan RateWindow = TimeSpan.FromHours(1);

    public async Task<SendCodeResult> SendAsync(string phoneNumber, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var windowStart = now - RateWindow;

        var recent = await context.PhoneVerificationCodes
            .Where(c => c.PhoneNumber == phoneNumber && c.CreatedAt >= windowStart)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        if (recent.Count >= MaxPerHour)
        {
            // Free again once the oldest of them ages out of the window.
            var oldest = recent[^1].CreatedAt;
            return new SendCodeResult(SendCodeStatus.TooMany, SecondsUntil(oldest + RateWindow, now), 0);
        }

        if (recent.Count > 0 && now - recent[0].CreatedAt < ResendInterval)
        {
            return new SendCodeResult(SendCodeStatus.TooSoon, SecondsUntil(recent[0].CreatedAt + ResendInterval, now), 0);
        }

        var code = NewCode();
        var record = new PhoneVerificationCode
        {
            PhoneNumber = phoneNumber,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code),
            CreatedAt = now,
            ExpiresAt = now + CodeLifetime,
        };

        // One live code per number: asking for a new one is also how you give up on the old one,
        // and it stops several codes being valid at once for guessing at.
        foreach (var previous in recent.Where(c => c.ConsumedAt is null))
        {
            previous.ConsumedAt = now;
        }

        // Saved before the SMS goes out, never after: a message can arrive while a request is still
        // in flight, and a code that the database has not heard of yet would be refused.
        context.PhoneVerificationCodes.Add(record);
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            await sms.SendAsync(phoneNumber, $"Mtabari code: {code}", cancellationToken);
        }
        catch (SmsServiceException ex)
        {
            // Nothing was delivered, so this attempt should not count against the hourly allowance.
            logger.LogWarning(ex, "Could not send a verification code; the attempt has been rolled back.");
            context.PhoneVerificationCodes.Remove(record);
            await context.SaveChangesAsync(cancellationToken);
            return new SendCodeResult(SendCodeStatus.SendFailed, 0, 0);
        }

        return new SendCodeResult(SendCodeStatus.Sent, (int)ResendInterval.TotalSeconds, (int)CodeLifetime.TotalSeconds);
    }

    public async Task<bool> TryConsumeAsync(string phoneNumber, string code)
    {
        var now = DateTime.UtcNow;

        var pending = await context.PhoneVerificationCodes
            .Where(c => c.PhoneNumber == phoneNumber
                && c.ConsumedAt == null
                && c.ExpiresAt > now
                && c.Attempts < MaxAttempts)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (pending is null)
        {
            return false;
        }

        if (!BCrypt.Net.BCrypt.Verify(code, pending.CodeHash))
        {
            pending.Attempts++;
            await context.SaveChangesAsync();
            return false;
        }

        pending.ConsumedAt = now;
        await context.SaveChangesAsync();
        return true;
    }

    /// <summary>Six digits from the cryptographic generator — leading zeros and all.</summary>
    private static string NewCode() =>
        RandomNumberGenerator.GetInt32(0, 1_000_000).ToString($"D{CodeLength}");

    private static int SecondsUntil(DateTime moment, DateTime now) =>
        Math.Max(1, (int)Math.Ceiling((moment - now).TotalSeconds));
}
