using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Server.Models;
using Server.Models.Bog;
using Server.Services.Interfaces;

namespace Server.Services;

/// <summary>
/// Talks to Bank of Georgia's e-commerce API: fetches a client-credentials token, registers orders,
/// and checks the signature on the callbacks that come back.
///
/// Registered as a singleton so the access token is cached across requests rather than fetched per
/// checkout — the bank issues one good for the best part of an hour, and asking for a fresh one on
/// every purchase is both slow and rude.
/// </summary>
public class BogPaymentService(
    IHttpClientFactory httpClientFactory,
    IOptions<BogOptions> options,
    ILogger<BogPaymentService> logger) : IBogPaymentService
{
    /// <summary>Names the configured client in Program.cs. A singleton cannot take a typed
    /// HttpClient — that is scoped to a request — so it takes the factory and asks for one.</summary>
    public const string HttpClientName = "bog";

    private readonly BogOptions _options = options.Value;

    private HttpClient CreateClient() => httpClientFactory.CreateClient(HttpClientName);

    /// <summary>Guards the token refresh, so a burst of checkouts fetches one token, not twenty.</summary>
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _accessToken;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;

    public bool IsConfigured => _options.IsConfigured;

    private async Task<string> GetAccessTokenAsync()
    {
        // A minute of slack, so a token that is about to lapse is not handed to a request that
        // will still be in flight when it does.
        if (_accessToken is not null && DateTimeOffset.UtcNow < _tokenExpiresAt.AddMinutes(-1))
        {
            return _accessToken;
        }

        await _tokenLock.WaitAsync();
        try
        {
            if (_accessToken is not null && DateTimeOffset.UtcNow < _tokenExpiresAt.AddMinutes(-1))
            {
                return _accessToken;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl)
            {
                Content = new FormUrlEncodedContent([new KeyValuePair<string, string>("grant_type", "client_credentials")]),
            };
            var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

            var response = await CreateClient().SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                logger.LogError("BOG token request failed: {Status} {Body}", response.StatusCode, body);
                throw new InvalidOperationException("Could not authenticate with the payment provider.");
            }

            var token = await response.Content.ReadFromJsonAsync<BogTokenResponse>()
                ?? throw new InvalidOperationException("Empty token response from the payment provider.");

            _accessToken = token.AccessToken;
            _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(token.ExpiresIn);
            return _accessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    public async Task<(string BogOrderId, string RedirectUrl)> CreateOrderAsync(MarketOrder order, MarketListing listing)
    {
        var accessToken = await GetAccessTokenAsync();

        var payload = new BogCreateOrderRequest
        {
            CallbackUrl = _options.CallbackUrl,
            ExternalOrderId = order.Id.ToString(),
            PurchaseUnits = new BogPurchaseUnits
            {
                Currency = order.Currency,
                TotalAmount = decimal.Round(order.Amount, 2),
                Basket =
                [
                    new BogBasketItem
                    {
                        ProductId = listing.Id.ToString(),
                        Description = string.IsNullOrWhiteSpace(listing.Title) ? listing.ItemType : listing.Title,
                        // The bank's basket counts whole units; a listing priced per kilo can be
                        // bought in fractions, so the basket carries one line at the order total
                        // and the real quantity stays on our own row.
                        Quantity = 1,
                        UnitPrice = decimal.Round(order.Amount, 2),
                    },
                ],
            },
            RedirectUrls = new BogRedirectUrls
            {
                Success = $"{_options.SuccessUrl}?order={order.Id}",
                Fail = $"{_options.FailUrl}?order={order.Id}",
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "ecommerce/orders")
        {
            Content = JsonContent.Create(payload),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        // The bank picks the language of its own payment page from this.
        request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("ka"));

        var response = await CreateClient().SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            logger.LogError("BOG order creation failed for order {OrderId}: {Status} {Body}", order.Id, response.StatusCode, body);
            throw new InvalidOperationException("The payment provider refused the order.");
        }

        var created = await response.Content.ReadFromJsonAsync<BogCreateOrderResponse>();
        var redirect = created?.Links?.Redirect?.Href;
        if (created is null || string.IsNullOrWhiteSpace(created.Id) || string.IsNullOrWhiteSpace(redirect))
        {
            logger.LogError("BOG order creation returned no redirect for order {OrderId}", order.Id);
            throw new InvalidOperationException("The payment provider returned no payment page.");
        }

        return (created.Id, redirect);
    }

    public bool VerifyCallbackSignature(string rawBody, string? signatureHeader)
    {
        // No key configured means no way to tell a real callback from a forged one, and treating
        // an unverified one as genuine would let anyone mark any order paid. Refuse instead.
        if (string.IsNullOrWhiteSpace(_options.CallbackPublicKey))
        {
            logger.LogError("BOG callback rejected: no CallbackPublicKey is configured.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            logger.LogWarning("BOG callback rejected: no Callback-Signature header.");
            return false;
        }

        try
        {
            using var rsa = RSA.Create();
            rsa.ImportFromPem(_options.CallbackPublicKey);
            return rsa.VerifyData(
                Encoding.UTF8.GetBytes(rawBody),
                Convert.FromBase64String(signatureHeader),
                HashAlgorithmName.SHA256,
                RSASignaturePadding.Pkcs1);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "BOG callback signature could not be checked.");
            return false;
        }
    }
}
