namespace Server.Integrations.WeatherApi;

public class WeatherForecast
{
    public string Location { get; set; } = string.Empty;
    public List<ForecastDay> Days { get; set; } = [];
}
