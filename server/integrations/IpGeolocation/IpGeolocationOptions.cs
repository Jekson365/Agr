namespace Server.Integrations.IpGeolocation;

public class IpGeolocationOptions
{
    public const string SectionName = "IpGeolocation";

    public bool Enabled { get; set; } = true;

    public string BaseUrl { get; set; } = "https://ipwho.is/";
}
