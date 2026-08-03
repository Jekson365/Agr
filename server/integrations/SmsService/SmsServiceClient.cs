using Microsoft.Extensions.Options;

namespace Server.Integrations.SmsService;

/// <summary>
/// Typed <see cref="HttpClient"/> over the smsservice.ge HTTP API v1.0. One GET to sendsms.php,
/// which answers in plain text as <c>CODE-MESSAGE_ID</c> — <c>0000</c> means the message was
/// accepted for delivery, anything else is a refusal worth naming in the log.
///
/// The account details stay server-side; nothing about them ever reaches a client.
/// </summary>
public class SmsServiceClient(
    HttpClient httpClient,
    IOptions<SmsServiceOptions> options,
    ILogger<SmsServiceClient> logger) : ISmsSender
{
    private readonly SmsServiceOptions _options = options.Value;

    /// <summary>What each code the API answers with means, for the log.</summary>
    private static readonly Dictionary<string, string> Failures = new()
    {
        ["0001"] = "invalid credentials, or this server's IP is not allowed",
        ["0003"] = "a required field was missing",
        ["0005"] = "empty message body",
        ["0007"] = "invalid phone number",
        ["0008"] = "not enough balance",
        ["0009"] = "invalid sender id (service_id)",
        ["0010"] = "the message contains a banned word",
    };

    public bool IsConfigured => _options.IsConfigured;

    public async Task SendAsync(string phoneNumber, string text, CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            throw new SmsServiceException(
                "SMS is not configured. Set SmsService:Username, SmsService:ApiPassword, "
                + "SmsService:ClientId and SmsService:ServiceId via appsettings.Development.json, "
                + "user-secrets, or the SmsService__* environment variables.");
        }

        // The API wants digits only, no leading +.
        var to = phoneNumber.TrimStart('+');

        var requestUri = "sendsms.php"
            + $"?username={Uri.EscapeDataString(_options.Username)}"
            + $"&password={Uri.EscapeDataString(_options.ApiPassword)}"
            + $"&client_id={Uri.EscapeDataString(_options.ClientId)}"
            + $"&service_id={Uri.EscapeDataString(_options.ServiceId)}"
            + $"&to={Uri.EscapeDataString(to)}"
            + $"&text={Uri.EscapeDataString(text)}"
            // Without this a Georgian message arrives as a row of question marks. It costs message
            // length (70 characters rather than 160), which is why the code SMS is kept short.
            + "&utf=1";

        HttpResponseMessage response;
        try
        {
            response = await httpClient.GetAsync(requestUri, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "SMS request failed for {Phone}.", Mask(phoneNumber));
            throw new SmsServiceException("Could not reach the SMS service.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(ex, "SMS request timed out for {Phone}.", Mask(phoneNumber));
            throw new SmsServiceException("The SMS service timed out.");
        }

        var body = (await response.Content.ReadAsStringAsync(cancellationToken)).Trim();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "SMS service returned HTTP {Status} for {Phone}: {Body}",
                (int)response.StatusCode, Mask(phoneNumber), body);
            throw new SmsServiceException($"SMS service returned {(int)response.StatusCode}.");
        }

        // "0000-000001" — the part before the dash is the outcome, the rest is their message id.
        var code = body.Split('-', 2)[0].Trim();
        if (code == "0000")
        {
            logger.LogInformation("SMS accepted for {Phone} ({Body}).", Mask(phoneNumber), body);
            return;
        }

        var reason = Failures.GetValueOrDefault(code, $"unrecognised response '{body}'");
        logger.LogWarning("SMS refused for {Phone}: {Code} — {Reason}", Mask(phoneNumber), code, reason);
        throw new SmsServiceException($"The SMS service refused the message ({code}).");
    }

    /// <summary>
    /// A number with its middle hidden, e.g. +995******456. Logs are read far more often than they
    /// are guarded, and a phone number is the one identifier these ones would otherwise carry.
    /// </summary>
    private static string Mask(string phoneNumber) =>
        phoneNumber.Length <= 7
            ? "***"
            : string.Concat(phoneNumber.AsSpan(0, 4), new string('*', phoneNumber.Length - 7), phoneNumber.AsSpan(phoneNumber.Length - 3));
}
