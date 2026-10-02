using System.Text.Json.Serialization;

namespace Server.Integrations.IpGeolocation.Models;

public class IpWhoIsResponse
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("message")] public string? Message { get; set; }
    [JsonPropertyName("country")] public string? Country { get; set; }
    [JsonPropertyName("country_code")] public string? CountryCode { get; set; }
    [JsonPropertyName("region")] public string? Region { get; set; }
    [JsonPropertyName("city")] public string? City { get; set; }
    [JsonPropertyName("latitude")] public double? Latitude { get; set; }
    [JsonPropertyName("longitude")] public double? Longitude { get; set; }
    [JsonPropertyName("connection")] public IpWhoIsConnection? Connection { get; set; }
}

public class IpWhoIsConnection
{
    [JsonPropertyName("isp")] public string? Isp { get; set; }
    [JsonPropertyName("org")] public string? Org { get; set; }
}
