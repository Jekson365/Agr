namespace Server.Integrations.WeatherApi;

public class ForecastDay
{
    public string Date { get; set; } = string.Empty;
    public double MaxTempC { get; set; }
    public double MinTempC { get; set; }
    public double AvgTempC { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public int ConditionCode { get; set; }
    public int ChanceOfRain { get; set; }
    public int ChanceOfSnow { get; set; }
    public double TotalPrecipMm { get; set; }
    public double MaxWindKph { get; set; }
    public int AvgHumidity { get; set; }
}
