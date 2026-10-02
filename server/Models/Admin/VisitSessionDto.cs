namespace Server.Models.Admin;

public class VisitSessionDto
{
    private const int MaxSteps = 100;

    public string SessionId { get; set; } = string.Empty;
    public string VisitorId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public int PageViews { get; set; }
    public int? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserContact { get; set; } = string.Empty;
    public string Ip { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Isp { get; set; } = string.Empty;
    public string Browser { get; set; } = string.Empty;
    public string BrowserVersion { get; set; } = string.Empty;
    public string Os { get; set; } = string.Empty;
    public string OsVersion { get; set; } = string.Empty;
    public VisitDevice Device { get; set; }
    public string UserAgent { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string TimeZone { get; set; } = string.Empty;
    public int ScreenWidth { get; set; }
    public int ScreenHeight { get; set; }
    public int ViewportWidth { get; set; }
    public int ViewportHeight { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Referrer { get; set; } = string.Empty;
    public string UtmSource { get; set; } = string.Empty;
    public string UtmMedium { get; set; } = string.Empty;
    public string UtmCampaign { get; set; } = string.Empty;
    public DateTime VisitorFirstSeen { get; set; }
    public int VisitorSessions { get; set; }
    public List<VisitStepDto> Steps { get; set; } = [];

    public static VisitSessionDto From(IReadOnlyList<SiteVisit> rows)
    {
        var first = rows[0];
        var located = rows.FirstOrDefault(r => r.CountryCode.Length > 0) ?? first;
        return new VisitSessionDto
        {
            SessionId = first.SessionId,
            VisitorId = first.VisitorId,
            StartedAt = first.CreatedAt,
            EndedAt = rows[^1].CreatedAt,
            PageViews = rows.Count,
            UserId = rows.LastOrDefault(r => r.UserId is not null)?.UserId,
            Ip = located.Ip,
            CountryCode = located.CountryCode,
            Country = located.Country,
            Region = located.Region,
            City = located.City,
            Latitude = located.Latitude,
            Longitude = located.Longitude,
            Isp = located.Isp,
            Browser = first.Browser,
            BrowserVersion = first.BrowserVersion,
            Os = first.Os,
            OsVersion = first.OsVersion,
            Device = first.Device,
            UserAgent = first.UserAgent,
            Language = first.Language,
            TimeZone = first.TimeZone,
            ScreenWidth = first.ScreenWidth,
            ScreenHeight = first.ScreenHeight,
            ViewportWidth = first.ViewportWidth,
            ViewportHeight = first.ViewportHeight,
            Source = first.Source,
            Referrer = first.Referrer,
            UtmSource = first.UtmSource,
            UtmMedium = first.UtmMedium,
            UtmCampaign = first.UtmCampaign,
            VisitorFirstSeen = first.CreatedAt,
            VisitorSessions = 1,
            Steps = rows.Take(MaxSteps).Select(r => new VisitStepDto { Path = r.Path, At = r.CreatedAt }).ToList(),
        };
    }
}

public class VisitStepDto
{
    public string Path { get; set; } = string.Empty;
    public DateTime At { get; set; }
}

public class VisitSessionListDto
{
    public List<VisitSessionDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
