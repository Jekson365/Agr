using Server.Models;

namespace Server.Services;

public static class BotSignals
{
    private static readonly string[] HostingNetworks =
    [
        "amazon",
        "google llc",
        "google cloud",
        "microsoft",
        "ovh",
        "hetzner",
        "digitalocean",
        "linode",
        "vultr",
        "the constant company",
        "choopa",
        "contabo",
        "oracle",
        "alibaba",
        "tencent",
        "huawei cloud",
        "petersburg internet network",
        "scaleway",
        "leaseweb",
        "hostinger",
        "ionos",
        "selectel",
        "timeweb",
        "colocrossing",
    ];

    public static bool IsBot(SiteVisit visit, bool webdriver) =>
        visit.Device == VisitDevice.Bot
        || webdriver
        || visit is { ScreenWidth: 800, ScreenHeight: 600 }
        || visit.TimeZone == "Etc/Unknown"
        || IsHostingNetwork(visit.Isp);

    private static bool IsHostingNetwork(string isp) =>
        isp.Length > 0 && HostingNetworks.Any(network => isp.Contains(network, StringComparison.OrdinalIgnoreCase));
}
