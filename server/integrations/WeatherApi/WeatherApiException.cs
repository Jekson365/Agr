namespace Server.Integrations.WeatherApi;

/// <summary>Thrown when a call to WeatherAPI.com fails or returns an error payload.</summary>
public class WeatherApiException(string message) : Exception(message);
