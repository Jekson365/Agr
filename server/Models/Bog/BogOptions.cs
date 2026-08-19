namespace Server.Models.Bog;

/// <summary>
/// Bank of Georgia e-commerce credentials and endpoints, bound from the "Bog" configuration
/// section.
///
/// <see cref="ClientSecret"/> is a real secret: it must come from user-secrets, an environment
/// variable or the deploy box's own configuration, never from appsettings.json in the repo, and
/// never from anything the browser can read. Every call to the bank happens here on the server for
/// exactly that reason.
///
/// With <see cref="ClientId"/> or <see cref="ClientSecret"/> empty the integration reports itself
/// as unconfigured and the checkout endpoint refuses politely, rather than failing at the bank.
/// </summary>
public class BogOptions
{
    public const string SectionName = "Bog";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>Where the client-credentials token is issued.</summary>
    public string TokenUrl { get; set; } = "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";

    /// <summary>Base for the payments API; order creation and receipts hang off this.</summary>
    public string ApiBaseUrl { get; set; } = "https://api.bog.ge/payments/v1/";

    /// <summary>
    /// Where the bank POSTs the result. Must be a public HTTPS address the bank can actually
    /// reach — localhost will never receive a callback, which is the usual reason a payment looks
    /// stuck in Pending during development.
    /// </summary>
    public string CallbackUrl { get; set; } = string.Empty;

    /// <summary>Where the buyer's browser is sent after paying. The marketplace app's origin.</summary>
    public string SuccessUrl { get; set; } = string.Empty;
    public string FailUrl { get; set; } = string.Empty;

    /// <summary>
    /// The bank's public key, PEM-encoded, used to check the signature on the callback. Without it
    /// callbacks are refused outright: an unverified callback is an open invitation for anyone to
    /// POST "paid" at this endpoint.
    /// </summary>
    public string CallbackPublicKey { get; set; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);
}
