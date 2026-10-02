namespace Server.Models.Admin;

public class VisitFilter
{
    public int Days { get; set; } = 30;
    public bool IncludeBots { get; set; }
    public string? Search { get; set; }
    public string? VisitorId { get; set; }
    public string? TimeZone { get; set; }
}
