using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Models.Admin;

namespace Server.Controllers;

public partial class AdminController
{
    public record SetPlanRequest(StoragePlan Plan);

    [HttpPut("users/{id:int}/plan")]
    public async Task<ActionResult<AdminUserDto>> SetPlan(int id, SetPlanRequest request)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        if (!Enum.IsDefined(request.Plan))
        {
            return BadRequest("Unknown plan.");
        }

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.Plan = request.Plan;
        await context.SaveChangesAsync();

        logger.LogInformation(
            "Plan set to {Plan} for user {UserId} by operator {OperatorId} ({Email})",
            request.Plan, id, op.Id, op.Email);

        var listingCount = await context.MarketListings.CountAsync(l => l.SellerId == id);
        return Ok(AdminUserDto.From(user, listingCount));
    }
}
