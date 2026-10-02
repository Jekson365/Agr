namespace Server.Models;

public class SiteVisit
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string VisitorId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Referrer { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string UtmSource { get; set; } = string.Empty;
    public string UtmMedium { get; set; } = string.Empty;
    public string UtmCampaign { get; set; } = string.Empty;
    public string Ip { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Isp { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string Browser { get; set; } = string.Empty;
    public string BrowserVersion { get; set; } = string.Empty;
    public string Os { get; set; } = string.Empty;
    public string OsVersion { get; set; } = string.Empty;
    public VisitDevice Device { get; set; }
    public string Language { get; set; } = string.Empty;
    public string TimeZone { get; set; } = string.Empty;
    public int ScreenWidth { get; set; }
    public int ScreenHeight { get; set; }
    public int ViewportWidth { get; set; }
    public int ViewportHeight { get; set; }
}
