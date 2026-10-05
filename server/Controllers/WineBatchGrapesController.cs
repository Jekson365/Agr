using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WineBatchGrapesController(
    IWineBatchGrapeRepository grapeRepository,
    IWineBatchRepository batchRepository) : ControllerBase
{
    private const string DuplicateMessage = "This batch already uses grapes from that vineyard. Change that row instead.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineBatchGrape>>> Get([FromQuery] int? wineBatchId)
    {
        return Ok(await grapeRepository.GetAsync(wineBatchId));
    }

    [HttpPost]
    public async Task<ActionResult<WineBatchGrape>> Create(WineBatchGrape grape)
    {
        var batch = await batchRepository.GetByIdAsync(grape.WineBatchId);
        if (batch is null)
        {
            return NotFound();
        }
        if (await CheckAsync(grape, batch, null) is { } problem)
        {
            return problem;
        }

        return Ok(await grapeRepository.AddAsync(grape, batch.StartDate));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, WineBatchGrape grape)
    {
        if (id != grape.Id)
        {
            return BadRequest();
        }

        var existing = await grapeRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        grape.WineBatchId = existing.WineBatchId;

        var batch = await batchRepository.GetByIdAsync(existing.WineBatchId);
        if (batch is null)
        {
            return NotFound();
        }
        if (await CheckAsync(grape, batch, id) is { } problem)
        {
            return problem;
        }

        await grapeRepository.UpdateAsync(grape);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await grapeRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (await batchRepository.IsDeletedAsync(existing.WineBatchId) == true)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        await grapeRepository.DeleteAsync(id);
        return NoContent();
    }

    private async Task<ActionResult?> CheckAsync(WineBatchGrape grape, WineBatch batch, int? excludeId)
    {
        if (grape.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }
        if (batch.IsDeleted)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }
        if (await grapeRepository.GetProductCategoryAsync(grape.TreeProductId) != TreeProductCategory.Wine)
        {
            return BadRequest("Only grapes from a vineyard can go into a wine batch.");
        }
        if (await grapeRepository.ExistsForBatchAsync(batch.Id, grape.TreeProductId, excludeId))
        {
            return Conflict(DuplicateMessage);
        }

        var available = await grapeRepository.GetAvailableAsync(grape.TreeProductId, excludeId);
        return grape.Amount > available ? Conflict($"Only {available} kg of these grapes is available.") : null;
    }
}
