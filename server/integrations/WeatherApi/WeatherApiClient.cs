using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using Server.Integrations.WeatherApi.Models;

namespace Server.Integrations.WeatherApi;

/// <summary>
/// Typed <see cref="HttpClient"/> wrapper over WeatherAPI.com. The API key is read from configuration
/// (see <see cref="WeatherApiOptions"/>) and stays server-side — the app only ever talks to our own
/// <c>/api/weather</c> endpoint, never to WeatherAPI.com directly.
/// </summary>
public class WeatherApiClient(
    HttpClient httpClient,
    IOptions<WeatherApiOptions> options,
    ILogger<WeatherApiClient> logger) : IWeatherClient
{
    private readonly WeatherApiOptions _options = options.Value;

    public async Task<CurrentWeather> GetCurrentAsync(string location, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "WeatherAPI key is not configured. Set 'WeatherApi:ApiKey' via appsettings.Development.json, "
                + "user-secrets, or the WeatherApi__ApiKey environment variable.");
        }

        var requestUri = $"current.json?key={Uri.EscapeDataString(_options.ApiKey)}"
            + $"&q={Uri.EscapeDataString(location)}&aqi=no";

        HttpResponseMessage response;
        try
        {
            response = await httpClient.GetAsync(requestUri, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "WeatherAPI request failed for location {Location}.", location);
            throw new WeatherApiException("Could not reach the weather service.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(ex, "WeatherAPI request timed out for location {Location}.", location);
            throw new WeatherApiException("The weather service timed out.");
        }

        var payload = await response.Content.ReadFromJsonAsync<WeatherApiCurrentResponse>(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = payload?.Error?.Message ?? $"Weather service returned {(int)response.StatusCode}.";
            logger.LogWarning("WeatherAPI error for {Location}: {Message}", location, message);
            throw new WeatherApiException(message);
        }

        if (payload?.Location is null || payload.Current is null)
        {
            throw new WeatherApiException("Weather service returned an unexpected response.");
        }

        return Map(payload);
    }

    private static CurrentWeather Map(WeatherApiCurrentResponse payload)
    {
        var location = payload.Location!;
        var current = payload.Current!;
        var condition = current.Condition;

        var place = string.IsNullOrWhiteSpace(location.Country)
            ? location.Name
            : $"{location.Name}, {location.Country}";

        // WeatherAPI returns protocol-relative icon URLs like //cdn.weatherapi.com/...
        var icon = condition?.Icon ?? string.Empty;
        if (icon.StartsWith("//", StringComparison.Ordinal))
        {
            icon = $"https:{icon}";
        }

        return new CurrentWeather
        {
            Location = place,
            TempC = current.TempC,
            TempF = current.TempF,
            Condition = condition?.Text ?? string.Empty,
            IconUrl = icon,
            ConditionCode = condition?.Code ?? 0,
            Humidity = current.Humidity,
            WindKph = current.WindKph,
            IsDay = current.IsDay == 1,
            LocalTime = location.LocalTime,
        };
    }
}
