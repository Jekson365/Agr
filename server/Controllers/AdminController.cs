using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Admin;
using Server.Services.Interfaces;

namespace Server.Controllers;

/// <summary>
/// The platform operator's endpoints, behind /api/admin.
///
/// **Every action re-reads <see cref="User.IsSuperAdmin"/> from the master database.** It is not
/// carried as a JWT claim: tokens here last a week, so a claim would leave a demoted operator with
/// working access for days after the column was cleared. One indexed lookup per request is a small
/// price for revocation that takes effect immediately.
///
/// Works entirely against <see cref="MasterDbContext"/>, like the marketplace controllers — users
/// and listings both live there, and nothing here touches a tenant database.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AdminController(
    MasterDbContext context,
    ICurrentTenant currentTenant,
    ILogger<AdminController> logger)
    : ControllerBase
{
    /// <summary>
    /// The caller if they are an operator, otherwise null. Returning the row rather than a bool so
    /// callers can log who did what without a second query.
    /// </summary>
    private async Task<User?> GetOperatorAsync()
    {
        var userId = currentTenant.UserId;
        if (userId == 0)
        {
            return null;
        }

        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return user is { IsSuperAdmin: true } ? user : null;
    }

    /// <summary>
    /// Whether the caller may see the manager page. The client asks this on load rather than
    /// trusting the flag in its stored session, which is a week old at worst and editable at best.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<object>> Me()
    {
        var op = await GetOperatorAsync();
        return Ok(new { isSuperAdmin = op is not null });
    }

    /// <summary>Everyone who has registered, newest first.</summary>
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
    {
        if (await GetOperatorAsync() is null)
        {
            // Not 401: the caller is a perfectly good signed-in user, they simply are not an
            // operator. 403 says that, and does not invite the client to try logging in again.
            return Forbid();
        }

        var users = await context.Users.AsNoTracking().OrderByDescending(u => u.CreatedAt).ToListAsync();

        // One grouped query for the counts rather than one per user.
        var counts = await context.MarketListings.AsNoTracking()
            .GroupBy(l => l.SellerId)
            .Select(g => new { SellerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SellerId, x => x.Count);

        return Ok(users.Select(u => AdminUserDto.From(u, counts.GetValueOrDefault(u.Id))));
    }

    /// <summary>
    /// Listings whose sellers have asked to be promoted. Oldest request first — a queue people are
    /// waiting in is only fair worked in the order they joined it.
    /// </summary>
    [HttpGet("premium-requests")]
    public async Task<ActionResult<IEnumerable<PremiumRequestDto>>> GetPremiumRequests([FromQuery] bool includeHandled = false)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        var query = context.MarketListings.AsNoTracking().Where(l => l.PremiumRequestedAt != null);
        if (!includeHandled)
        {
            // Still waiting: asked for, not yet granted.
            query = query.Where(l => !l.IsPremium);
        }

        var listings = await query.OrderBy(l => l.PremiumRequestedAt).ToListAsync();

        var sellerIds = listings.Select(l => l.SellerId).Distinct().ToList();
        var sellers = await context.Users.AsNoTracking()
            .Where(u => sellerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        return Ok(listings.Select(l =>
        {
            sellers.TryGetValue(l.SellerId, out var seller);
            return PremiumRequestDto.From(l, seller);
        }));
    }

    /// <summary>Grants the promotion: the listing sorts first and wears the gold border.</summary>
    [HttpPost("premium-requests/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        var listing = await context.MarketListings.FirstOrDefaultAsync(l => l.Id == id);
        if (listing is null)
        {
            return NotFound();
        }

        listing.IsPremium = true;
        listing.PremiumGrantedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        logger.LogInformation("Listing {ListingId} promoted by operator {OperatorId} ({Email})", id, op.Id, op.Email);
        return Ok(PremiumRequestDto.From(listing, null));
    }

    /// <summary>
    /// Turns a promotion down, or takes one back. The request is cleared rather than kept as a
    /// rejection, so the seller can ask again after changing the listing — a permanent no would
    /// need a reason attached to be fair, and there is nowhere to put one yet.
    /// </summary>
    [HttpPost("premium-requests/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        var listing = await context.MarketListings.FirstOrDefaultAsync(l => l.Id == id);
        if (listing is null)
        {
            return NotFound();
        }

        listing.IsPremium = false;
        listing.PremiumGrantedAt = null;
        listing.PremiumRequestedAt = null;
        await context.SaveChangesAsync();

        logger.LogInformation("Listing {ListingId} promotion refused by operator {OperatorId} ({Email})", id, op.Id, op.Email);
        return NoContent();
    }
}
