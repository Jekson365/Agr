namespace Server.Services;

/// <summary>
/// Turns a number as somebody typed it into the one canonical form the rest of the server uses:
/// E.164, e.g. <c>+995599123456</c>. Everything that looks a number up — the unique index, the
/// verification codes, signing in — compares that form, so "599 12 34 56" and "+995 599 123 456"
/// cannot end up as two different people.
/// </summary>
public static class PhoneNumbers
{
    /// <summary>
    /// True when <paramref name="input"/> is a number this server will accept, with
    /// <paramref name="normalized"/> set to its E.164 form. Spaces, dashes and brackets are
    /// ignored; a leading <c>+</c> is taken as "this already has its country code".
    /// </summary>
    public static bool TryNormalize(string? input, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var trimmed = input.Trim();
        var digits = new string([.. trimmed.Where(char.IsAsciiDigit)]);
        if (digits.Length == 0)
        {
            return false;
        }

        // Written with its country code: take it as given, within what E.164 allows.
        if (trimmed.StartsWith('+'))
        {
            if (digits.Length is < 8 or > 15)
            {
                return false;
            }
            normalized = '+' + digits;
            return true;
        }

        // A Georgian mobile as it is written locally — 5XX XXX XXX.
        if (digits.Length == 9 && digits[0] == '5')
        {
            normalized = "+995" + digits;
            return true;
        }

        // The same number with the country code already on the front, just without the plus.
        if (digits.Length == 12 && digits.StartsWith("995", StringComparison.Ordinal))
        {
            normalized = '+' + digits;
            return true;
        }

        // Anything else is too ambiguous to guess a country for.
        return false;
    }
}
