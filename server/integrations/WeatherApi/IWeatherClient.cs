namespace Server.Integrations.WeatherApi;

public interface IWeatherClient
{
    /// <summary>
    /// Fetches the current weather for <paramref name="location"/> — a city name, "lat,lon" pair,
    /// postcode, or "auto:ip". Throws <see cref="WeatherApiException"/> on an upstream failure.
    /// </summary>
    Task<CurrentWeather> GetCurrentAsync(string location, CancellationToken cancellationToken = default);
}
