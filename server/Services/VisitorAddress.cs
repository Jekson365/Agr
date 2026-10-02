using System.Net;
using System.Net.Sockets;

namespace Server.Services;

public static class VisitorAddress
{
    public static string Resolve(HttpContext context)
    {
        var address = context.Connection.RemoteIpAddress;

        if ((address is null || IPAddress.IsLoopback(address))
            && IPAddress.TryParse(context.Request.Headers["X-Real-IP"].ToString(), out var forwarded))
        {
            address = forwarded;
        }

        if (address is null)
        {
            return string.Empty;
        }

        return (address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address).ToString();
    }

    public static bool IsPublic(string ip)
    {
        if (!IPAddress.TryParse(ip, out var address))
        {
            return false;
        }

        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address)
            || address.IsIPv6LinkLocal
            || address.IsIPv6SiteLocal
            || address.IsIPv6UniqueLocal
            || address.IsIPv6Multicast)
        {
            return false;
        }

        if (address.AddressFamily != AddressFamily.InterNetwork)
        {
            return true;
        }

        var bytes = address.GetAddressBytes();
        return bytes[0] switch
        {
            0 or 10 or 127 => false,
            100 => bytes[1] < 64 || bytes[1] > 127,
            169 => bytes[1] != 254,
            172 => bytes[1] < 16 || bytes[1] > 31,
            192 => bytes[1] != 168,
            _ => bytes[0] < 224,
        };
    }
}
