using System.Text.RegularExpressions;
using Server.Models;

namespace Server.Services;

public record ParsedUserAgent(string Browser, string BrowserVersion, string Os, string OsVersion, VisitDevice Device);

public static class UserAgentParser
{
    private const RegexOptions Options = RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;

    private static readonly Regex BotPattern = Pattern(
        @"bot[/;)+\-]|bot$|crawl|spider|slurp|externalhit|headless|lighthouse|pagespeed|inspectiontool|preview|python|curl|wget|java/|go-http|okhttp|axios|node-fetch|scrapy|phantomjs|selenium|puppeteer|playwright|httpclient|libwww");

    private static readonly Regex BotName = Pattern(@"[\w\-.]*(?:bot|crawler|spider|slurp|externalhit|headless)[\w\-.]*");
    private static readonly Regex FirstToken = Pattern(@"^[^/\s;(]+");
    private static readonly Regex TabletPattern = Pattern(@"iPad|Tablet|Kindle|Silk/|PlayBook");
    private static readonly Regex MobilePattern = Pattern(@"Mobi|iPhone|iPod|Windows Phone|Opera Mini|IEMobile");
    private static readonly Regex WindowsPattern = Pattern(@"Windows NT (\d+\.\d+)");
    private static readonly Regex AppleMobileVersion = Pattern(@"OS (\d+)[_\d]* like Mac");
    private static readonly Regex AndroidVersion = Pattern(@"Android[\s/]?(\d+)");

    private static readonly (string Name, Regex Detect, Regex Version)[] Browsers =
    [
        ("Messenger", Pattern(@"Orca-Android|MessengerForiOS|MessengerLite"), Pattern(@"FBAV/(\d+)")),
        ("Facebook", Pattern(@"FBAN|FBAV|FB_IAB"), Pattern(@"FBAV/(\d+)")),
        ("Instagram", Pattern(@"Instagram"), Pattern(@"Instagram (\d+)")),
        ("TikTok", Pattern(@"musical_ly|BytedanceWebview|TikTok"), Pattern(@"app_version/(\d+)")),
        ("Edge", Pattern(@"Edg(?:e|A|iOS)?/"), Pattern(@"Edg(?:e|A|iOS)?/(\d+)")),
        ("Opera", Pattern(@"OPR/|OPiOS/|Opera"), Pattern(@"(?:OPR|OPiOS|Version)/(\d+)")),
        ("Samsung Internet", Pattern(@"SamsungBrowser/"), Pattern(@"SamsungBrowser/(\d+)")),
        ("Yandex", Pattern(@"YaBrowser/"), Pattern(@"YaBrowser/(\d+)")),
        ("WebView", Pattern(@"; wv\)"), Pattern(@"Chrome/(\d+)")),
        ("Firefox", Pattern(@"Firefox/|FxiOS/"), Pattern(@"(?:Firefox|FxiOS)/(\d+)")),
        ("Chrome", Pattern(@"Chrome/|CriOS/"), Pattern(@"(?:Chrome|CriOS)/(\d+)")),
        ("Safari", Pattern(@"Safari/"), Pattern(@"Version/(\d+)")),
    ];

    public static ParsedUserAgent Parse(string userAgent, int touchPoints)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return new ParsedUserAgent("Unknown", string.Empty, "Unknown", string.Empty, VisitDevice.Bot);
        }

        var (os, osVersion) = SystemOf(userAgent, touchPoints);

        if (BotPattern.IsMatch(userAgent))
        {
            var name = BotName.Match(userAgent);
            var bot = name.Success ? name.Value : FirstToken.Match(userAgent).Value;
            return new ParsedUserAgent(bot, string.Empty, os, osVersion, VisitDevice.Bot);
        }

        var (browser, version) = BrowserOf(userAgent);
        return new ParsedUserAgent(browser, version, os, osVersion, DeviceOf(userAgent, os));
    }

    private static (string Name, string Version) BrowserOf(string userAgent)
    {
        foreach (var (name, detect, version) in Browsers)
        {
            if (detect.IsMatch(userAgent))
            {
                return (name, version.Match(userAgent).Groups[1].Value);
            }
        }

        return (Has(userAgent, "AppleWebKit") ? "WebView" : "Other", string.Empty);
    }

    private static (string Name, string Version) SystemOf(string userAgent, int touchPoints)
    {
        var windows = WindowsPattern.Match(userAgent);
        if (windows.Success)
        {
            return ("Windows", WindowsVersion(windows.Groups[1].Value));
        }

        if (Has(userAgent, "iPhone") || Has(userAgent, "iPod"))
        {
            return ("iOS", AppleMobileVersion.Match(userAgent).Groups[1].Value);
        }

        if (Has(userAgent, "iPad"))
        {
            return ("iPadOS", AppleMobileVersion.Match(userAgent).Groups[1].Value);
        }

        if (Has(userAgent, "Android"))
        {
            return ("Android", AndroidVersion.Match(userAgent).Groups[1].Value);
        }

        if (Has(userAgent, "CrOS"))
        {
            return ("ChromeOS", string.Empty);
        }

        if (Has(userAgent, "Macintosh") || Has(userAgent, "Mac OS X"))
        {
            return (touchPoints > 1 ? "iPadOS" : "macOS", string.Empty);
        }

        return (Has(userAgent, "Linux") ? "Linux" : "Other", string.Empty);
    }

    private static VisitDevice DeviceOf(string userAgent, string os)
    {
        if (os == "iPadOS" || TabletPattern.IsMatch(userAgent) || (os == "Android" && !MobilePattern.IsMatch(userAgent)))
        {
            return VisitDevice.Tablet;
        }

        return MobilePattern.IsMatch(userAgent) || os is "iOS" or "Android" ? VisitDevice.Mobile : VisitDevice.Desktop;
    }

    private static string WindowsVersion(string nt) => nt switch
    {
        "10.0" => "10/11",
        "6.3" => "8.1",
        "6.2" => "8",
        "6.1" => "7",
        _ => nt,
    };

    private static bool Has(string value, string token) => value.Contains(token, StringComparison.OrdinalIgnoreCase);

    private static Regex Pattern(string pattern) => new(pattern, Options);
}
