using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models.Reports;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReportsController(IReportRepository reportRepository) : ControllerBase
{
    [HttpGet("stock-movements")]
    public async Task<ActionResult<IEnumerable<StockMovementReportRow>>> GetStockMovementReport()
    {
        return Ok(await reportRepository.GetStockMovementReportAsync());
    }
}
