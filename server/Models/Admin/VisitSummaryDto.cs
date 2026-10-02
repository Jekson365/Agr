namespace Server.Models.Admin;

public class VisitSummaryDto
{
    public int PageViews { get; set; }
    public int Visitors { get; set; }
    public int Sessions { get; set; }
    public int ReturningVisitors { get; set; }
    public int SignedInUsers { get; set; }
    public int Bots { get; set; }
    public VisitBucketUnit Unit { get; set; }
    public List<VisitBucketDto> Buckets { get; set; } = [];
    public List<VisitCountDto> Countries { get; set; } = [];
    public List<VisitCountDto> Cities { get; set; } = [];
    public List<VisitCountDto> Pages { get; set; } = [];
    public List<VisitCountDto> Sources { get; set; } = [];
    public List<VisitCountDto> Browsers { get; set; } = [];
    public List<VisitCountDto> Systems { get; set; } = [];
    public List<VisitCountDto> Devices { get; set; } = [];
    public List<VisitPointDto> Points { get; set; } = [];
}

public class VisitBucketDto
{
    public DateTime Start { get; set; }
    public int Views { get; set; }
    public int Visitors { get; set; }
}

public class VisitCountDto
{
    public string Key { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public int Visitors { get; set; }
    public int Views { get; set; }
}

public class VisitPointDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string City { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public int Visitors { get; set; }
}

public class VisitKeyed
{
    public string Key { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string VisitorId { get; set; } = string.Empty;
}
