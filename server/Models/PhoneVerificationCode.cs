namespace Server.Models;

/// <summary>
/// A code texted to a number to prove that whoever asked for it is holding that phone. Rows are
/// kept after they are used rather than deleted — the recent history of a number is exactly what
/// the send limits in <see cref="Services.PhoneVerificationService"/> are counted from.
/// </summary>
public class PhoneVerificationCode
{
    public int Id { get; set; }

    /// <summary>The number it was sent to, normalised to E.164 (see <see cref="Services.PhoneNumbers"/>).</summary>
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Hash of the digits, never the digits themselves. Six digits is a small enough space that a
    /// leaked table would be worth guessing against, so the code lives only in the SMS.
    /// </summary>
    public string CodeHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>After this the code is refused however correct it is.</summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>Wrong guesses so far. Past the limit the code is dead and a new one must be sent.</summary>
    public int Attempts { get; set; }

    /// <summary>When it was spent on a registration, or null while it is still good for one.</summary>
    public DateTime? ConsumedAt { get; set; }
}
