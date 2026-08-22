using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models.Admin;

namespace Server.Controllers;

/// <summary>
/// Who may open the farm management software.
///
/// An account registered from the marketplace has no farm and no database behind it. Granting
/// access here is the whole of it — the database is provisioned by the next login, which already
/// does so for any account that has access.
/// </summary>
public partial class AdminController
{
    public record SetManagementAccessRequest(bool Value);

    [HttpPut("users/{id:int}/management-access")]
    public async Task<ActionResult<AdminUserDto>> SetManagementAccess(int id, SetManagementAccessRequest request)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        // Refused rather than allowed and regretted: an operator taking their own access away has
        // no way back in without another operator, and there may not be one.
        if (op.Id == id)
        {
            return Conflict("An operator cannot change their own access.");
        }

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.HasManagementAccess = request.Value;
        await context.SaveChangesAsync();

        logger.LogInformation(
            "Management access {State} for user {UserId} by operator {OperatorId} ({Email})",
            request.Value ? "granted" : "withdrawn", id, op.Id, op.Email);

        var listingCount = await context.MarketListings.CountAsync(l => l.SellerId == id);
        return Ok(AdminUserDto.From(user, listingCount));
    }
}
