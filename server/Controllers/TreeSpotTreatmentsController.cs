using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeSpotTreatmentsController(
    ITreeSpotTreatmentRepository spotTreatmentRepository,
    ITreeStockRepository treeStockRepository) : ControllerBase
{
    /// <summary>Trees are picked off a drawing, so a selection is bounded by what can be drawn.
    /// The cap is here to refuse a request that was never made by hand.</summary>
    private const int MaxTreesPerBatch = 2000;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeSpotTreatment>>> GetByTreeStock([FromQuery] int? treeStockId)
    {
        return Ok(await spotTreatmentRepository.GetAsync(treeStockId));
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<TreeSpotTreatment>>> Create(TreeSpotTreatmentBatch batch)
    {
        if (string.IsNullOrWhiteSpace(batch.Type))
        {
            return BadRequest("Type is required.");
        }
        if (batch.Trees.Count == 0)
        {
            return BadRequest("At least one tree is required.");
        }
        if (batch.Trees.Count > MaxTreesPerBatch)
        {
            return BadRequest($"At most {MaxTreesPerBatch} trees can be recorded at once.");
        }
        if (batch.Trees.Any(tree => tree.Index < 0))
        {
            return BadRequest("Tree index must not be negative.");
        }

        var stock = await treeStockRepository.GetByIdAsync(batch.TreeStockId);
        if (stock is null)
        {
            return NotFound();
        }
        if (stock.IsDeleted)
        {
            return Conflict("That orchard was removed.");
        }

        // The same tree twice in one selection is the client's slip, not a second application.
        var rows = batch.Trees
            .GroupBy(tree => tree.Index)
            .Select(group => group.First())
            .Select(tree => new TreeSpotTreatment
            {
                TreeStockId = batch.TreeStockId,
                TreeIndex = tree.Index,
                Latitude = tree.Latitude,
                Longitude = tree.Longitude,
                Date = batch.Date,
                Type = batch.Type.Trim(),
                Note = (batch.Note ?? string.Empty).Trim(),
            });

        return Ok(await spotTreatmentRepository.AddRangeAsync(rows));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await spotTreatmentRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
