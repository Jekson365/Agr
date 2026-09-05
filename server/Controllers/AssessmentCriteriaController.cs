using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AssessmentCriteriaController(IAssessmentCriteriaRepository assessmentCriteriaRepository)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssessmentCriteria>>> Get(
        [FromQuery] int? stockId,
        [FromQuery] int? treeStockId)
    {
        if (stockId is null && treeStockId is null)
        {
            return BadRequest("Provide stockId or treeStockId.");
        }

        return Ok(await assessmentCriteriaRepository.GetAsync(stockId, treeStockId));
    }

    [HttpPut]
    public async Task<ActionResult<IEnumerable<AssessmentCriteria>>> SaveSheet(AssessmentCriteriaSheet sheet)
    {
        if (sheet.StockId is null == sheet.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        if (sheet.Lines.Any(line => Negative(line.SizeFrom, line.SizeTo, line.WeightFrom, line.WeightTo)))
        {
            return BadRequest("A size or weight cannot be negative.");
        }

        if (sheet.Lines.Any(line => OutOfPercent(line.Damaged, line.Rotten, line.Moisture)))
        {
            return BadRequest("Damaged, rotten and moisture are percentages between 0 and 100.");
        }

        return Ok(await assessmentCriteriaRepository.SaveSheetAsync(sheet));
    }

    private static bool Negative(params decimal?[] values) => values.Any(value => value < 0);

    private static bool OutOfPercent(params decimal?[] values) =>
        values.Any(value => value < 0 || value > 100);
}
