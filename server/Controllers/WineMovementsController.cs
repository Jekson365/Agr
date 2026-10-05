using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WineMovementsController(
    IWineMovementRepository movementRepository,
    IWineBatchRepository batchRepository,
    IWineRecordRepository<WineBottling> bottlingRepository) : ControllerBase
{
    private const string BottlingMessage = "Say which bottling of this batch the bottles belong to.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineMovement>>> Get([FromQuery] int? wineBatchId)
    {
        return Ok(await movementRepository.GetAsync(wineBatchId));
    }

    [HttpPost]
    public async Task<ActionResult<WineMovement>> Adjust(WineAdjustmentRequest request)
    {
        if (request.Delta == 0 && request.BottleDelta == 0)
        {
            return BadRequest("Nothing to adjust.");
        }

        var deleted = await batchRepository.IsDeletedAsync(request.WineBatchId);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        var (liters, bottles) = await movementRepository.GetBalanceAsync(request.WineBatchId);
        if (liters + request.Delta < 0 || bottles + request.BottleDelta < 0)
        {
            return Conflict($"Only {liters} L and {bottles} bottles are in this batch.");
        }
        if (await CheckBottlingAsync(request.WineBatchId, request.WineBottlingId, request.BottleDelta) is { } problem)
        {
            return problem;
        }

        return Ok(await movementRepository.AddAsync(new WineMovement
        {
            WineBatchId = request.WineBatchId,
            Delta = request.Delta,
            BottleDelta = request.BottleDelta,
            Source = WineMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            WineBottlingId = request.BottleDelta == 0 ? null : request.WineBottlingId,
        }));
    }

    [HttpPost("sale")]
    public async Task<ActionResult<WineMovement>> RecordSale(WineSaleRequest request)
    {
        if (request.Quantity <= 0 || request.Revenue < 0)
        {
            return BadRequest("Quantity must be positive.");
        }
        if (request.Bottles && request.Quantity != decimal.Truncate(request.Quantity))
        {
            return BadRequest("Bottles are counted whole.");
        }

        var deleted = await batchRepository.IsDeletedAsync(request.WineBatchId);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        var (liters, bottles) = await movementRepository.GetBalanceAsync(request.WineBatchId);
        var available = request.Bottles ? bottles : liters;
        if (request.Quantity > available)
        {
            return Conflict($"Only {available} is available to sell.");
        }

        var bottleDelta = request.Bottles ? -(int)request.Quantity : 0;
        if (await CheckBottlingAsync(request.WineBatchId, request.WineBottlingId, bottleDelta) is { } problem)
        {
            return problem;
        }

        return Ok(await movementRepository.AddAsync(new WineMovement
        {
            WineBatchId = request.WineBatchId,
            Delta = request.Bottles ? 0m : -request.Quantity,
            BottleDelta = bottleDelta,
            Source = WineMovementSource.Market,
            Date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Revenue = request.Revenue,
            WineBottlingId = request.Bottles ? request.WineBottlingId : null,
        }));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await movementRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (existing.Source != WineMovementSource.Manual)
        {
            return BadRequest("This entry belongs to its record and goes with it.");
        }
        if (await batchRepository.IsDeletedAsync(existing.WineBatchId) == true)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        var (liters, bottles) = await movementRepository.GetBalanceAsync(existing.WineBatchId, id);
        var bottlingLeft = existing.WineBottlingId is int bottlingId
            ? await movementRepository.GetBottlesLeftAsync(bottlingId, id)
            : 0;
        if (liters < 0 || bottles < 0 || bottlingLeft < 0)
        {
            return Conflict("Removing this entry would leave the batch below zero.");
        }

        await movementRepository.DeleteAsync(id);
        return NoContent();
    }

    private async Task<ActionResult?> CheckBottlingAsync(int wineBatchId, int? wineBottlingId, int bottleDelta)
    {
        if (bottleDelta == 0)
        {
            return null;
        }

        var bottling = wineBottlingId is int id ? await bottlingRepository.GetByIdAsync(id) : null;
        if (bottling is null || bottling.WineBatchId != wineBatchId)
        {
            return BadRequest(BottlingMessage);
        }

        var left = await movementRepository.GetBottlesLeftAsync(bottling.Id);
        return left + bottleDelta < 0
            ? Conflict($"Only {left} bottles of {bottling.BottleSize} L are left from that bottling.")
            : null;
    }
}
