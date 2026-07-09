namespace Server.Integrations.WeatherApi;

/// <summary>Binds the "WeatherApi" configuration section (see appsettings.json).</summary>
public class WeatherApiOptions
{
    public const string SectionName = "WeatherApi";

    /// <summary>Base address of the WeatherAPI.com REST API, including the trailing slash.</summary>
    public string BaseUrl { get; set; } = "https://api.weatherapi.com/v1/";

    /// <summary>
    /// Your WeatherAPI.com API key. Never commit a real key — set it in
    /// appsettings.Development.json, user-secrets, or the <c>WeatherApi__ApiKey</c> environment variable.
    /// </summary>
    public string ApiKey { get; set; } = "cbccd86af353480d838185041260907";
}
