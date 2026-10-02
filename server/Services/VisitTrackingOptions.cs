namespace Server.Services;

public class VisitTrackingOptions
{
    public const string SectionName = "VisitTracking";

    public List<string> ExcludedEmails { get; set; } = [];
}
