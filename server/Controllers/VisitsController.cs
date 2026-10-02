using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisitsController(IVisitRecorder recorder) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    [EnableRateLimiting(VisitTrackingSetup.RateLimitPolicy)]
    public async Task<IActionResult> Record(RecordVisitRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VisitorId) || string.IsNullOrWhiteSpace(request.SessionId))
        {
            return BadRequest();
        }

        await recorder.RecordAsync(request, VisitorAddress.Resolve(HttpContext), Request.Headers.UserAgent.ToString());
        return NoContent();
    }
}
