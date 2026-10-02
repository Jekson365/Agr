namespace Server.Models;

public class RecordVisitRequest
{
    public string? VisitorId { get; set; }
    public string? SessionId { get; set; }
    public string? Path { get; set; }
    public string? Referrer { get; set; }
    public string? UtmSource { get; set; }
    public string? UtmMedium { get; set; }
    public string? UtmCampaign { get; set; }
    public string? Language { get; set; }
    public string? TimeZone { get; set; }
    public int ScreenWidth { get; set; }
    public int ScreenHeight { get; set; }
    public int ViewportWidth { get; set; }
    public int ViewportHeight { get; set; }
    public int TouchPoints { get; set; }
}
