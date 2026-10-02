namespace Server.Integrations.IpGeolocation;

public interface IIpGeolocationClient
{
    Task<IpLocation?> LocateAsync(string ip, CancellationToken cancellationToken = default);
}
