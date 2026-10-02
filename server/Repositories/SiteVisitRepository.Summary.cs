using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Models.Admin;
using Server.Services;

namespace Server.Repositories;

public partial class SiteVisitRepository
{
    private const int TopLimit = 10;
    private const int PointLimit = 300;

    public async Task<VisitSummaryDto> GetSummaryAsync(VisitFilter filter)
    {
        var window = VisitWindow.For(filter.Days, filter.TimeZone);
        var excluded = await ExcludedVisitorIdsAsync();
        var visits = Period(window.SinceUtc, filter.IncludeBots, excluded);

        return new VisitSummaryDto
        {
            PageViews = await visits.CountAsync(),
            Visitors = await visits.Select(v => v.VisitorId).Distinct().CountAsync(),
            Sessions = await visits.Select(v => v.SessionId).Distinct().CountAsync(),
            ReturningVisitors = await visits
                .GroupBy(v => v.VisitorId)
                .Where(g => g.Select(v => v.SessionId).Distinct().Count() > 1)
                .CountAsync(),
            SignedInUsers = await visits.Where(v => v.UserId != null).Select(v => v.UserId).Distinct().CountAsync(),
            Bots = await Period(window.SinceUtc, true, excluded).CountAsync(v => v.Device == VisitDevice.Bot),
            Unit = window.Unit,
            Buckets = await BucketsAsync(window, filter.IncludeBots, excluded),
            Countries = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.CountryCode, Detail = v.Country, VisitorId = v.VisitorId })),
            Cities = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.City, Detail = v.CountryCode, VisitorId = v.VisitorId })),
            Pages = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.Path, Detail = "", VisitorId = v.VisitorId })),
            Sources = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.Source, Detail = "", VisitorId = v.VisitorId })),
            Browsers = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.Browser, Detail = "", VisitorId = v.VisitorId })),
            Systems = await TopAsync(visits.Select(v => new VisitKeyed { Key = v.Os, Detail = "", VisitorId = v.VisitorId })),
            Devices = await DevicesAsync(visits),
            Points = await PointsAsync(visits),
        };
    }

    private async Task<List<VisitBucketDto>> BucketsAsync(VisitWindow window, bool includeBots, List<string> excluded)
    {
        var unit = window.Unit.ToString().ToLowerInvariant();
        var zone = window.Zone.Id;
        var since = window.SinceUtc;
        var skipped = excluded.ToArray();

        var rows = await context.Database.SqlQuery<VisitBucketDto>($"""
            SELECT date_trunc({unit}, "CreatedAt" AT TIME ZONE {zone}) AS "Start",
                   COUNT(*)::int AS "Views",
                   COUNT(DISTINCT "VisitorId")::int AS "Visitors"
            FROM "SiteVisits"
            WHERE "CreatedAt" >= {since}
              AND ({includeBots} OR "Device" <> 'Bot')
              AND NOT ("VisitorId" = ANY({skipped}))
            GROUP BY 1
            """).ToListAsync();

        var byStart = rows.ToDictionary(r => r.Start);
        var cursor = window.Start ?? (rows.Count > 0 ? rows.Min(r => r.Start) : window.End);
        var buckets = new List<VisitBucketDto>();

        for (; cursor <= window.End; cursor = VisitWindow.Advance(cursor, window.Unit, 1))
        {
            buckets.Add(byStart.TryGetValue(cursor, out var hit) ? hit : new VisitBucketDto { Start = cursor });
        }

        return buckets;
    }

    private static Task<List<VisitCountDto>> TopAsync(IQueryable<VisitKeyed> keyed) =>
        keyed.GroupBy(k => new { k.Key, k.Detail })
            .Select(g => new VisitCountDto
            {
                Key = g.Key.Key,
                Detail = g.Key.Detail,
                Visitors = g.Select(k => k.VisitorId).Distinct().Count(),
                Views = g.Count(),
            })
            .OrderByDescending(c => c.Visitors)
            .ThenByDescending(c => c.Views)
            .Take(TopLimit)
            .ToListAsync();

    private static async Task<List<VisitCountDto>> DevicesAsync(IQueryable<SiteVisit> visits)
    {
        var rows = await visits
            .GroupBy(v => v.Device)
            .Select(g => new { Device = g.Key, Visitors = g.Select(v => v.VisitorId).Distinct().Count(), Views = g.Count() })
            .ToListAsync();

        return rows
            .OrderByDescending(r => r.Visitors)
            .Select(r => new VisitCountDto { Key = r.Device.ToString(), Visitors = r.Visitors, Views = r.Views })
            .ToList();
    }

    private static Task<List<VisitPointDto>> PointsAsync(IQueryable<SiteVisit> visits) =>
        visits.Where(v => v.Latitude != null && v.Longitude != null)
            .GroupBy(v => new { Latitude = v.Latitude!.Value, Longitude = v.Longitude!.Value, v.City, v.CountryCode })
            .Select(g => new VisitPointDto
            {
                Latitude = g.Key.Latitude,
                Longitude = g.Key.Longitude,
                City = g.Key.City,
                CountryCode = g.Key.CountryCode,
                Visitors = g.Select(v => v.VisitorId).Distinct().Count(),
            })
            .OrderByDescending(p => p.Visitors)
            .Take(PointLimit)
            .ToListAsync();
}
