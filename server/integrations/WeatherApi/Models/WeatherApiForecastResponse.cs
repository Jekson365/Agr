using System.Text.Json.Serialization;

namespace Server.Integrations.WeatherApi.Models;

public class WeatherApiForecastResponse
{
    [JsonPropertyName("location")]
    public WeatherApiLocation? Location { get; set; }

    [JsonPropertyName("forecast")]
    public WeatherApiForecast? Forecast { get; set; }

    [JsonPropertyName("error")]
    public WeatherApiError? Error { get; set; }
}

public class WeatherApiForecast
{
    [JsonPropertyName("forecastday")]
    public List<WeatherApiForecastDay> ForecastDay { get; set; } = [];
}

public class WeatherApiForecastDay
{
    [JsonPropertyName("date")] public string Date { get; set; } = string.Empty;
    [JsonPropertyName("day")] public WeatherApiDay? Day { get; set; }
}

public class WeatherApiDay
{
    [JsonPropertyName("maxtemp_c")] public double MaxTempC { get; set; }
    [JsonPropertyName("mintemp_c")] public double MinTempC { get; set; }
    [JsonPropertyName("avgtemp_c")] public double AvgTempC { get; set; }
    [JsonPropertyName("maxwind_kph")] public double MaxWindKph { get; set; }
    [JsonPropertyName("totalprecip_mm")] public double TotalPrecipMm { get; set; }
    [JsonPropertyName("avghumidity")] public double AvgHumidity { get; set; }
    [JsonPropertyName("daily_chance_of_rain")] public int ChanceOfRain { get; set; }
    [JsonPropertyName("daily_chance_of_snow")] public int ChanceOfSnow { get; set; }
    [JsonPropertyName("condition")] public WeatherApiCondition? Condition { get; set; }
}
