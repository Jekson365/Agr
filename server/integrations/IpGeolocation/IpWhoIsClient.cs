using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Server.Integrations.IpGeolocation.Models;

namespace Server.Integrations.IpGeolocation;

public class IpWhoIsClient(
    HttpClient httpClient,
    IOptions<IpGeolocationOptions> options,
    ILogger<IpWhoIsClient> logger) : IIpGeolocationClient
{
    private const string Fields = "success,message,country,country_code,region,city,latitude,longitude,connection";

    public async Task<IpLocation?> LocateAsync(string ip, CancellationToken cancellationToken = default)
    {
        if (!options.Value.Enabled || string.IsNullOrWhiteSpace(ip))
        {
            return null;
        }

        try
        {
            var response = await httpClient.GetFromJsonAsync<IpWhoIsResponse>(
                $"{Uri.EscapeDataString(ip)}?fields={Fields}", cancellationToken);

            if (response is not { Success: true })
            {
                logger.LogWarning("IP lookup for {Ip} was refused: {Message}", ip, response?.Message);
                return null;
            }

            return new IpLocation(
                response.CountryCode ?? string.Empty,
                response.Country ?? string.Empty,
                response.Region ?? string.Empty,
                response.City ?? string.Empty,
                response.Latitude,
                response.Longitude,
                response.Connection?.Isp ?? response.Connection?.Org ?? string.Empty);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            logger.LogWarning(ex, "IP lookup for {Ip} failed.", ip);
            return null;
        }
    }
}
