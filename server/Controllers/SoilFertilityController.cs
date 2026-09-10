using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SoilFertilityController(ISoilFertilityScoringService scoringService) : ControllerBase
{
    [HttpGet("reference")]
    public async Task<ActionResult<SoilReferenceData>> GetReference()
    {
        return Ok(await scoringService.GetReferenceDataAsync());
    }

    [HttpGet("assessment/{investigationId:int}")]
    public async Task<ActionResult<SoilFertilityAssessmentDetail>> GetAssessment(int investigationId)
    {
        var detail = await scoringService.GetAsync(investigationId);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost("assessment/{investigationId:int}")]
    public async Task<ActionResult<SoilFertilityAssessmentDetail>> Calculate(int investigationId)
    {
        var detail = await scoringService.CalculateAsync(investigationId);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<SoilFertilityAssessment>>> GetHistory([FromQuery] int landPlotId)
    {
        return Ok(await scoringService.HistoryAsync(landPlotId));
    }
}
