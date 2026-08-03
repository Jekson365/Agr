namespace Server.Integrations.SmsService;

/// <summary>Sends a text message to one number.</summary>
public interface ISmsSender
{
    /// <summary>Whether the account details are present. False means every send would fail.</summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Sends <paramref name="text"/> to <paramref name="phoneNumber"/> (E.164, e.g. +995599123456).
    /// Throws <see cref="SmsServiceException"/> if the provider refuses it or cannot be reached.
    /// </summary>
    Task SendAsync(string phoneNumber, string text, CancellationToken cancellationToken = default);
}
