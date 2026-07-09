using System.Text.Json.Serialization;

namespace Server.Integrations.WeatherApi.Models;

/// <summary>Shape of WeatherAPI.com's <c>current.json</c> response (only the fields we consume).</summary>
public class WeatherApiCurrentResponse
{
    [JsonPropertyName("location")]
    public WeatherApiLocation? Location { get; set; }

    [JsonPropertyName("current")]
    public WeatherApiCurrent? Current { get; set; }

    /// <summary>Present instead of location/current when the request is rejected (bad key, unknown place).</summary>
    [JsonPropertyName("error")]
    public WeatherApiError? Error { get; set; }
}

public class WeatherApiLocation
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("region")] public string Region { get; set; } = string.Empty;
    [JsonPropertyName("country")] public string Country { get; set; } = string.Empty;
    [JsonPropertyName("lat")] public double Lat { get; set; }
    [JsonPropertyName("lon")] public double Lon { get; set; }
    [JsonPropertyName("localtime")] public string LocalTime { get; set; } = string.Empty;
}

public class WeatherApiCurrent
{
    [JsonPropertyName("temp_c")] public double TempC { get; set; }
    [JsonPropertyName("temp_f")] public double TempF { get; set; }
    [JsonPropertyName("is_day")] public int IsDay { get; set; }
    [JsonPropertyName("humidity")] public int Humidity { get; set; }
    [JsonPropertyName("wind_kph")] public double WindKph { get; set; }
    [JsonPropertyName("condition")] public WeatherApiCondition? Condition { get; set; }
}

public class WeatherApiCondition
{
    [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    [JsonPropertyName("icon")] public string Icon { get; set; } = string.Empty;
    [JsonPropertyName("code")] public int Code { get; set; }
}

public class WeatherApiError
{
    [JsonPropertyName("code")] public int Code { get; set; }
    [JsonPropertyName("message")] public string Message { get; set; } = string.Empty;
}
