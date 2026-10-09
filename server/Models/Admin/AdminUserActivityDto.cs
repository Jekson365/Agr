namespace Server.Models.Admin;

public enum AdminSignInMethod
{
    Email,
    Phone,
    Google,
}

public class AdminUserActivityDto
{
    public AdminSignInMethod SignIn { get; set; }
    public DateTime? FarmCreatedAt { get; set; }
    public long StorageUsedBytes { get; set; }
    public long? StorageLimitBytes { get; set; }
    public int PageViews { get; set; }
    public int Sessions { get; set; }
    public AdminVisitDto? LastVisit { get; set; }
    public int Neighbours { get; set; }
    public int Sales { get; set; }
    public decimal SalesAmount { get; set; }
}

public class AdminVisitDto
{
    public DateTime At { get; set; }
    public VisitDevice Device { get; set; }
    public string Browser { get; set; } = string.Empty;
    public string Os { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}
