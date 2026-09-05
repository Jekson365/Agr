using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeTreatmentsController(
    ITreeTreatmentRepository treeTreatmentRepository,
    ITreeStockRepository treeStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeTreatment>>> GetByTreeStock([FromQuery] int? treeStockId)
    {
        return Ok(await treeTreatmentRepository.GetAsync(treeStockId));
    }

    [HttpPost]
    public async Task<ActionResult<TreeTreatment>> Create(TreeTreatment treatment)
    {
        if (string.IsNullOrWhiteSpace(treatment.Type))
        {
            return BadRequest("Type is required.");
        }

        var stock = await treeStockRepository.GetByIdAsync(treatment.TreeStockId);
        if (stock is null)
        {
            return NotFound();
        }
        if (stock.IsDeleted)
        {
            return Conflict("That orchard was removed.");
        }

        return Ok(await treeTreatmentRepository.AddAsync(treatment));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await treeTreatmentRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
