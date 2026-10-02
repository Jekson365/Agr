using Server.Models.Admin;

namespace Server.Services;

public record VisitWindow(VisitBucketUnit Unit, DateTime? Start, DateTime End, DateTime SinceUtc, TimeZoneInfo Zone)
{
    public static readonly DateTime Beginning = new(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static VisitWindow For(int days, string? timeZone)
    {
        var zone = ResolveZone(timeZone);
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone);
        var (unit, count) = days switch
        {
            <= 0 => (VisitBucketUnit.Month, 0),
            1 => (VisitBucketUnit.Hour, 24),
            <= 31 => (VisitBucketUnit.Day, days),
            <= 120 => (VisitBucketUnit.Week, (days + 6) / 7),
            _ => (VisitBucketUnit.Month, (int)Math.Round(days / 30.44)),
        };

        var end = Truncate(now, unit);
        if (count == 0)
        {
            return new VisitWindow(unit, null, end, Beginning, zone);
        }

        var start = Advance(end, unit, 1 - count);
        return new VisitWindow(unit, start, end, ToUtc(start, zone), zone);
    }

    public static DateTime Truncate(DateTime value, VisitBucketUnit unit) => unit switch
    {
        VisitBucketUnit.Hour => new DateTime(value.Year, value.Month, value.Day, value.Hour, 0, 0),
        VisitBucketUnit.Day => value.Date,
        VisitBucketUnit.Week => value.Date.AddDays(-(((int)value.DayOfWeek + 6) % 7)),
        _ => new DateTime(value.Year, value.Month, 1),
    };

    public static DateTime Advance(DateTime value, VisitBucketUnit unit, int count) => unit switch
    {
        VisitBucketUnit.Hour => value.AddHours(count),
        VisitBucketUnit.Day => value.AddDays(count),
        VisitBucketUnit.Week => value.AddDays(count * 7),
        _ => value.AddMonths(count),
    };

    private static DateTime ToUtc(DateTime local, TimeZoneInfo zone) =>
        TimeZoneInfo.ConvertTimeToUtc(zone.IsInvalidTime(local) ? local.AddHours(1) : local, zone);

    private static TimeZoneInfo ResolveZone(string? id) =>
        !string.IsNullOrWhiteSpace(id) && TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone) && zone.HasIanaId
            ? zone
            : TimeZoneInfo.Utc;
}
