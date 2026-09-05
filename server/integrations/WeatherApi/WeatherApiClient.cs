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
    public const int MaxForecastDays = 14;

    private readonly WeatherApiOptions _options = options.Value;

    public async Task<CurrentWeather> GetCurrentAsync(string location, CancellationToken cancellationToken = default)
    {
        var requestUri = $"current.json?key={Key()}&q={Uri.EscapeDataString(location)}&aqi=no";
        var payload = await SendAsync<WeatherApiCurrentResponse>(
            requestUri, location, response => response.Error, cancellationToken);

        if (payload.Location is null || payload.Current is null)
        {
            throw new WeatherApiException("Weather service returned an unexpected response.");
        }

        return MapCurrent(payload.Location, payload.Current);
    }

    public async Task<WeatherForecast> GetForecastAsync(
        string location,
        int days,
        CancellationToken cancellationToken = default)
    {
        var wanted = Math.Clamp(days, 1, MaxForecastDays);
        var requestUri = $"forecast.json?key={Key()}&q={Uri.EscapeDataString(location)}"
            + $"&days={wanted}&aqi=no&alerts=no";
        var payload = await SendAsync<WeatherApiForecastResponse>(
            requestUri, location, response => response.Error, cancellationToken);

        if (payload.Location is null || payload.Forecast is null)
        {
            throw new WeatherApiException("Weather service returned an unexpected response.");
        }

        return new WeatherForecast
        {
            Location = Place(payload.Location),
            Days = payload.Forecast.ForecastDay.Select(MapDay).ToList(),
        };
    }

    private string Key()
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "WeatherAPI key is not configured. Set 'WeatherApi:ApiKey' via appsettings.Development.json, "
                + "user-secrets, or the WeatherApi__ApiKey environment variable.");
        }

        return Uri.EscapeDataString(_options.ApiKey);
    }

    private async Task<T> SendAsync<T>(
        string requestUri,
        string location,
        Func<T, WeatherApiError?> error,
        CancellationToken cancellationToken)
    {
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

        var payload = await response.Content.ReadFromJsonAsync<T>(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = (payload is null ? null : error(payload)?.Message)
                ?? $"Weather service returned {(int)response.StatusCode}.";
            logger.LogWarning("WeatherAPI error for {Location}: {Message}", location, message);
            throw new WeatherApiException(message);
        }

        if (payload is null)
        {
            throw new WeatherApiException("Weather service returned an unexpected response.");
        }

        return payload;
    }

    private static CurrentWeather MapCurrent(WeatherApiLocation location, WeatherApiCurrent current)
    {
        var condition = current.Condition;

        return new CurrentWeather
        {
            Location = Place(location),
            TempC = current.TempC,
            TempF = current.TempF,
            Condition = condition?.Text ?? string.Empty,
            IconUrl = Icon(condition),
            ConditionCode = condition?.Code ?? 0,
            Humidity = current.Humidity,
            WindKph = current.WindKph,
            IsDay = current.IsDay == 1,
            LocalTime = location.LocalTime,
        };
    }

    private static ForecastDay MapDay(WeatherApiForecastDay forecastDay)
    {
        var day = forecastDay.Day;
        var condition = day?.Condition;

        return new ForecastDay
        {
            Date = forecastDay.Date,
            MaxTempC = day?.MaxTempC ?? 0,
            MinTempC = day?.MinTempC ?? 0,
            AvgTempC = day?.AvgTempC ?? 0,
            Condition = condition?.Text ?? string.Empty,
            IconUrl = Icon(condition),
            ConditionCode = condition?.Code ?? 0,
            ChanceOfRain = day?.ChanceOfRain ?? 0,
            ChanceOfSnow = day?.ChanceOfSnow ?? 0,
            TotalPrecipMm = day?.TotalPrecipMm ?? 0,
            MaxWindKph = day?.MaxWindKph ?? 0,
            AvgHumidity = (int)Math.Round(day?.AvgHumidity ?? 0),
        };
    }

    private static string Place(WeatherApiLocation location) =>
        string.IsNullOrWhiteSpace(location.Country)
            ? location.Name
            : $"{location.Name}, {location.Country}";

    // WeatherAPI returns protocol-relative icon URLs like //cdn.weatherapi.com/...
    private static string Icon(WeatherApiCondition? condition)
    {
        var icon = condition?.Icon ?? string.Empty;
        return icon.StartsWith("//", StringComparison.Ordinal) ? $"https:{icon}" : icon;
    }
}
