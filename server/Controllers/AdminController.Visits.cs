using Microsoft.AspNetCore.Mvc;
using Server.Models.Admin;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

public partial class AdminController
{
    [HttpGet("visits/summary")]
    public async Task<ActionResult<VisitSummaryDto>> GetVisitSummary(
        [FromQuery] VisitFilter filter,
        [FromServices] ISiteVisitRepository visits)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        return Ok(await visits.GetSummaryAsync(filter));
    }

    [HttpGet("visits/sessions")]
    public async Task<ActionResult<VisitSessionListDto>> GetVisitSessions(
        [FromQuery] VisitFilter filter,
        [FromServices] ISiteVisitRepository visits,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        return Ok(await visits.GetSessionsAsync(filter, Math.Max(1, page), Math.Clamp(pageSize, 1, 100)));
    }
}
