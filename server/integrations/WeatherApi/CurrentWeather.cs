namespace Server.Integrations.WeatherApi;

/// <summary>The trimmed, client-friendly current-weather result returned by <c>/api/weather</c>.</summary>
public class CurrentWeather
{
    public string Location { get; set; } = string.Empty;
    public double TempC { get; set; }
    public double TempF { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public int ConditionCode { get; set; }
    public int Humidity { get; set; }
    public double WindKph { get; set; }
    public bool IsDay { get; set; }
    public string LocalTime { get; set; } = string.Empty;
}
