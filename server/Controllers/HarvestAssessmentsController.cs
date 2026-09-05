using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestAssessmentsController(
    IHarvestAssessmentRepository harvestAssessmentRepository,
    IHarvestResultRepository harvestResultRepository,
    IHarvestTreeRepository harvestTreeRepository,
    IHarvestRepository harvestRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestAssessment>>> Get(
        [FromQuery] int? harvestId,
        [FromQuery] int? stockId,
        [FromQuery] int? treeStockId)
    {
        return Ok(await harvestAssessmentRepository.GetAsync(harvestId, stockId, treeStockId));
    }

    [HttpPut]
    public async Task<ActionResult<IEnumerable<HarvestAssessment>>> SaveSheet(HarvestAssessmentSheet sheet)
    {
        if (sheet.StockId is null == sheet.TreeStockId is null)
        {
            return BadRequest("Provide exactly one of stockId or treeStockId.");
        }

        if (sheet.Lines.Any(line => line.Quantity < 0 || line.Wasted < 0))
        {
            return BadRequest("A graded quantity cannot be negative.");
        }

        var harvest = await harvestRepository.GetByIdAsync(sheet.HarvestId);
        if (harvest is null)
        {
            return NotFound();
        }

        if (!harvest.Status.IsPicked())
        {
            return Conflict("A harvest is assessed once it is marked Harvested.");
        }

        // The sheet splits the pick, so it cannot come to more than the pick. Checked here as well
        // as in the client: the record behind the figure can change under an open sheet. An
        // orchard's pick is on the trees it took the fruit off, not on a result row.
        var harvested = harvest.Kind == HarvestKind.Fruit
            ? (await harvestTreeRepository.GetAsync(sheet.HarvestId))
                .Where(tree => tree.TreeStockId == sheet.TreeStockId)
                .Sum(tree => tree.HarvestedAmount)
            : (await harvestResultRepository.GetAsync(sheet.HarvestId))
                .Where(result => result.StockId == sheet.StockId && result.TreeStockId == sheet.TreeStockId)
                .Sum(result => result.Amount);

        if (sheet.Lines.Sum(line => line.Quantity + line.Wasted) > harvested)
        {
            return Conflict("The graded quantity cannot exceed what the harvest recorded for this good.");
        }

        return Ok(await harvestAssessmentRepository.SaveSheetAsync(sheet));
    }
}
