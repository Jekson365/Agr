using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public partial class WineBatchesController(
    AppDbContext context,
    IWineBatchRepository batchRepository,
    IWineBatchGrapeRepository grapeRepository,
    IWineMovementRepository movementRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    public const string DeletedMessage = "This wine batch was removed.";
    public const string StockedMessage = "A batch moved to stock can no longer be deleted.";
    public const string NotStockedMessage = "Move this batch to stock before adjusting its balance.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineBatchSummary>>> GetAll([FromQuery] bool includeDeleted = false)
    {
        return Ok(await batchRepository.GetSummariesAsync(includeDeleted));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<WineBatchSummary>> GetById(int id)
    {
        var summary = (await batchRepository.GetSummariesAsync(true, id)).FirstOrDefault();
        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpGet("{id:int}/stages")]
    public async Task<ActionResult<IEnumerable<WineStageChange>>> GetStages(int id)
    {
        return Ok(await batchRepository.GetStageChangesAsync(id));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, WineBatch batch)
    {
        if (id != batch.Id)
        {
            return BadRequest();
        }
        if (Validate(batch.Name, batch.Vintage) is { } invalid)
        {
            return BadRequest(invalid);
        }

        var deleted = await batchRepository.IsDeletedAsync(id);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(DeletedMessage);
        }

        await batchRepository.UpdateAsync(batch);
        return NoContent();
    }

    [HttpPut("{id:int}/liters")]
    public async Task<IActionResult> SetProducedLiters(int id, WineLitersRequest request)
    {
        if (request.Liters < 0)
        {
            return BadRequest("Liters cannot be negative.");
        }

        var deleted = await batchRepository.IsDeletedAsync(id);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(DeletedMessage);
        }

        var production = await movementRepository.GetProductionAsync(id);
        var (others, _) = await movementRepository.GetBalanceAsync(id, production?.Id);
        if (others + request.Liters < 0)
        {
            return Conflict($"{-others} L of this wine has already left the batch.");
        }

        if (production is null)
        {
            await movementRepository.AddAsync(new WineMovement
            {
                WineBatchId = id,
                Delta = request.Liters,
                Source = WineMovementSource.Production,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
            });
            return NoContent();
        }

        production.Delta = request.Liters;
        await movementRepository.UpdateAsync(production);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var batch = await batchRepository.GetByIdAsync(id);
        if (batch is null)
        {
            return NotFound();
        }
        if (batch.Stage == WineStage.Stocked)
        {
            return Conflict(StockedMessage);
        }

        if (await batchRepository.HasRecordsAsync(id))
        {
            await batchRepository.SoftDeleteAsync(id);
            return NoContent();
        }

        await batchRepository.DeleteAsync(id);
        return NoContent();
    }

    private static string? Validate(string name, int vintage)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return "A wine batch needs a name.";
        }
        if (vintage < 1900 || vintage > 2200)
        {
            return "The vintage year is out of range.";
        }
        return null;
    }
}
