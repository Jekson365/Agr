using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services;

/// <summary>
/// Keeps an account registered from the marketplace out of the farm management software.
///
/// The open list below is what a marketplace account needs and nothing else, so anything added
/// later is gated by default — the safe way round, since forgetting to open a marketplace route
/// shows up immediately while forgetting to gate a management one would not show up at all.
///
/// The flag is read from master per request rather than carried as a claim: tokens last a week,
/// so granting or withdrawing access would otherwise take effect a week late.
/// </summary>
public class ManagementAccessMiddleware(RequestDelegate next)
{
    private static readonly string[] OpenPaths =
    [
        "/api/auth",
        "/api/sellers",
        "/api/marketlistings",
        "/api/marketorders",
        // Platform operations, not farm management — and it carries its own, stronger gate: every
        // action there re-reads IsSuperAdmin. Gating it here as well would let an operator lock
        // themselves out of the page that grants the access they just removed.
        "/api/admin",
    ];

    public async Task InvokeAsync(HttpContext context, MasterDbContext master)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)
            || OpenPaths.Any(open => path.StartsWith(open, StringComparison.OrdinalIgnoreCase))
            || context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var claim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out var userId))
        {
            await next(context);
            return;
        }

        var allowed = await master.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.HasManagementAccess)
            .FirstOrDefaultAsync();

        if (!allowed)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("This account is registered for the marketplace only.");
            return;
        }

        await next(context);
    }
}
