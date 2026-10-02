using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Server.Integrations.IpGeolocation;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Services;

public static class VisitTrackingSetup
{
    public const string RateLimitPolicy = "visits";

    public static IServiceCollection AddVisitTracking(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<VisitTrackingOptions>(configuration.GetSection(VisitTrackingOptions.SectionName));
        services.Configure<IpGeolocationOptions>(configuration.GetSection(IpGeolocationOptions.SectionName));
        services.AddHttpClient<IIpGeolocationClient, IpWhoIsClient>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<IpGeolocationOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(5);
        });

        services.AddScoped<ISiteVisitRepository, SiteVisitRepository>();
        services.AddScoped<IVisitRecorder, VisitRecorder>();

        services.Configure<ForwardedHeadersOptions>(options => options.ForwardedHeaders = ForwardedHeaders.XForwardedFor);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(RateLimitPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
                VisitorAddress.Resolve(context),
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 120, Window = TimeSpan.FromMinutes(1) }));
        });

        return services;
    }

    public static WebApplication UseVisitTracking(this WebApplication app)
    {
        app.UseForwardedHeaders();
        app.UseRateLimiter();
        return app;
    }
}
