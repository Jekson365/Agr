using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models.Reports;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController(
    IReportRepository reportRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    [HttpGet("stock-movements")]
    public async Task<ActionResult<IEnumerable<StockMovementReportRow>>> GetStockMovementReport()
    {
        try
        {
            await planLimitService.EnsureBalanceAllowedAsync();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok(await reportRepository.GetStockMovementReportAsync());
    }

    /// <summary>The report's value-over-time and per-series panels, already totalled. Gated like
    /// the stock report — it reads the same balances.</summary>
    [HttpGet("overview")]
    public async Task<ActionResult<ReportOverview>> GetOverview(
        [FromQuery] ReportCategory category,
        [FromQuery] ReportPeriod period)
    {
        return Ok(await reportRepository.GetOverviewAsync(category, period));
    }

    /// <summary>The detail panel behind a bar in the value chart.</summary>
    [HttpGet("day")]
    public async Task<ActionResult<ReportDayDetails>> GetDay(
        [FromQuery] ReportCategory category,
        [FromQuery] DateOnly day)
    {
        return Ok(await reportRepository.GetDayDetailsAsync(category, day));
    }

    /// <summary>The detail panel behind a bar in the grouped chart.</summary>
    [HttpGet("series")]
    public async Task<ActionResult<ReportSeriesDetails>> GetSeries(
        [FromQuery] ReportCategory category,
        [FromQuery] ReportPeriod period,
        [FromQuery] string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return BadRequest("A series key is required.");
        }

        return Ok(await reportRepository.GetSeriesDetailsAsync(category, period, key));
    }
}
