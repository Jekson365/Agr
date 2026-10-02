namespace Server.Integrations.IpGeolocation;

public record IpLocation(
    string CountryCode,
    string Country,
    string Region,
    string City,
    double? Latitude,
    double? Longitude,
    string Isp);
