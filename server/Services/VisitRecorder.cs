using Server.Integrations.IpGeolocation;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Services;

public class VisitRecorder(
    ISiteVisitRepository visits,
    IIpGeolocationClient geolocation,
    ICurrentTenant currentTenant) : IVisitRecorder
{
    private static readonly TimeSpan LocationReuse = TimeSpan.FromDays(7);
    private static readonly string[] HostPrefixes = ["www.", "m.", "l.", "lm.", "mobile.", "web."];

    public async Task RecordAsync(RecordVisitRequest request, string ip, string userAgent)
    {
        var agent = UserAgentParser.Parse(userAgent, request.TouchPoints);
        var referrer = Clip(request.Referrer, 512);
        var utmSource = Clip(request.UtmSource, 128);

        var visit = new SiteVisit
        {
            VisitorId = Clip(request.VisitorId, 64),
            SessionId = Clip(request.SessionId, 64),
            UserId = currentTenant.UserId == 0 ? null : currentTenant.UserId,
            Path = Clip(request.Path, 512),
            Referrer = referrer,
            Source = SourceOf(utmSource, referrer),
            UtmSource = utmSource,
            UtmMedium = Clip(request.UtmMedium, 128),
            UtmCampaign = Clip(request.UtmCampaign, 128),
            Ip = ip,
            UserAgent = Clip(userAgent, 512),
            Browser = agent.Browser,
            BrowserVersion = agent.BrowserVersion,
            Os = agent.Os,
            OsVersion = agent.OsVersion,
            Device = agent.Device,
            Language = Clip(request.Language, 32),
            TimeZone = Clip(request.TimeZone, 64),
            ScreenWidth = Dimension(request.ScreenWidth),
            ScreenHeight = Dimension(request.ScreenHeight),
            ViewportWidth = Dimension(request.ViewportWidth),
            ViewportHeight = Dimension(request.ViewportHeight),
        };

        await LocateAsync(visit);
        await visits.AddAsync(visit);
    }

    private async Task LocateAsync(SiteVisit visit)
    {
        if (!VisitorAddress.IsPublic(visit.Ip))
        {
            return;
        }

        var known = await visits.FindLocatedAsync(visit.Ip, DateTime.UtcNow - LocationReuse);
        var location = known is null
            ? await geolocation.LocateAsync(visit.Ip)
            : new IpLocation(known.CountryCode, known.Country, known.Region, known.City, known.Latitude, known.Longitude, known.Isp);

        if (location is null)
        {
            return;
        }

        visit.CountryCode = location.CountryCode;
        visit.Country = location.Country;
        visit.Region = location.Region;
        visit.City = location.City;
        visit.Latitude = location.Latitude;
        visit.Longitude = location.Longitude;
        visit.Isp = location.Isp;
    }

    private static string SourceOf(string utmSource, string referrer)
    {
        if (utmSource.Length > 0)
        {
            return utmSource.ToLowerInvariant();
        }

        if (!Uri.TryCreate(referrer, UriKind.Absolute, out var uri) || uri.Host.Length == 0)
        {
            return string.Empty;
        }

        var host = uri.Host.ToLowerInvariant();
        var prefix = HostPrefixes.FirstOrDefault(p => host.StartsWith(p, StringComparison.Ordinal) && host.Length > p.Length);
        return prefix is null ? host : host[prefix.Length..];
    }

    private static string Clip(string? value, int length)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        return trimmed.Length <= length ? trimmed : trimmed[..length];
    }

    private static int Dimension(int value) => Math.Clamp(value, 0, 100_000);
}
