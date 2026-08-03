namespace Server.Integrations.SmsService;

/// <summary>Binds the "SmsService" configuration section (see appsettings.json).</summary>
public class SmsServiceOptions
{
    public const string SectionName = "SmsService";

    /// <summary>Base address of the smsservice.ge HTTP API, including the trailing slash.</summary>
    public string BaseUrl { get; set; } = "https://bi.msg.ge/";

    /// <summary>Account nickname. Never commit a real one — see <see cref="ApiPassword"/>.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Account password. Set it in appsettings.Development.json, user-secrets, or the
    /// <c>SmsService__ApiPassword</c> environment variable — never in appsettings.json, which is
    /// committed.
    /// </summary>
    public string ApiPassword { get; set; } = string.Empty;

    /// <summary>Account identifier, issued by smsservice.ge (their <c>client_id</c>).</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>Sender id the message goes out under (their <c>service_id</c>).</summary>
    public string ServiceId { get; set; } = string.Empty;

    /// <summary>True once every value the API needs is present.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Username)
        && !string.IsNullOrWhiteSpace(ApiPassword)
        && !string.IsNullOrWhiteSpace(ClientId)
        && !string.IsNullOrWhiteSpace(ServiceId);
}
