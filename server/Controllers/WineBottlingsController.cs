using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WineBottlingsController(
    AppDbContext context,
    IWineRecordRepository<WineBottling> repository,
    IWineMovementRepository movementRepository,
    IWineBatchRepository batchRepository) : ControllerBase
{
    private const string SoldMessage = "Bottles from this bottling have already left the batch.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineBottling>>> Get([FromQuery] int? wineBatchId)
    {
        return Ok(await repository.GetAsync(wineBatchId));
    }

    [HttpPost]
    public async Task<ActionResult<WineBottling>> Create(WineBottling bottling)
    {
        if (await CheckAsync(bottling.WineBatchId, bottling, null) is { } problem)
        {
            return problem;
        }

        bottling.Id = 0;
        bottling.Lot = Clean(bottling.Lot);
        await using var transaction = await context.Database.BeginTransactionAsync();
        var created = await repository.AddAsync(bottling);
        await movementRepository.AddAsync(MovementFor(created));
        await transaction.CommitAsync();
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, WineBottling bottling)
    {
        if (id != bottling.Id)
        {
            return BadRequest();
        }

        var existing = await repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        var movement = await OwnMovementAsync(id);
        if (await CheckAsync(existing.WineBatchId, bottling, movement?.Id, id) is { } problem)
        {
            return problem;
        }

        existing.Date = bottling.Date;
        existing.BottleSize = bottling.BottleSize;
        existing.Count = bottling.Count;
        existing.Lot = Clean(bottling.Lot);
        existing.Cost = bottling.Cost;

        var next = MovementFor(existing);
        if (movement is null)
        {
            context.WineMovements.Add(next);
        }
        else
        {
            movement.Delta = next.Delta;
            movement.BottleDelta = next.BottleDelta;
            movement.Date = next.Date;
        }

        await repository.UpdateAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (await batchRepository.IsDeletedAsync(existing.WineBatchId) == true)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        var movement = await OwnMovementAsync(id);
        var (_, bottles) = await movementRepository.GetBalanceAsync(existing.WineBatchId, movement?.Id);
        var moved = await context.WineMovements
            .AnyAsync(m => m.WineBottlingId == id && m.Source != WineMovementSource.Bottling);
        if (bottles < 0 || moved)
        {
            return Conflict(SoldMessage);
        }

        await repository.DeleteAsync(existing);
        return NoContent();
    }

    private async Task<ActionResult?> CheckAsync(
        int wineBatchId,
        WineBottling bottling,
        int? ownMovementId,
        int? bottlingId = null)
    {
        if (bottling.Count <= 0 || bottling.BottleSize <= 0 || bottling.BottleSize > 30)
        {
            return BadRequest("Give a bottle size and a count.");
        }
        if (bottling.Cost < 0)
        {
            return BadRequest("Cost cannot be negative.");
        }

        var deleted = await batchRepository.IsDeletedAsync(wineBatchId);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        var (liters, bottles) = await movementRepository.GetBalanceAsync(wineBatchId, ownMovementId);
        if (bottling.Count * bottling.BottleSize > liters)
        {
            return Conflict($"Only {liters} L are in the cellar.");
        }
        if (bottles + bottling.Count < 0)
        {
            return Conflict(SoldMessage);
        }

        var gone = bottlingId is int id ? await movementRepository.GetBottlesLeftAsync(id, ownMovementId) : 0;
        return gone + bottling.Count < 0 ? Conflict(SoldMessage) : null;
    }

    private Task<WineMovement?> OwnMovementAsync(int bottlingId) =>
        context.WineMovements.FirstOrDefaultAsync(m => m.WineBottlingId == bottlingId && m.Source == WineMovementSource.Bottling);

    private static WineMovement MovementFor(WineBottling bottling) => new()
    {
        WineBatchId = bottling.WineBatchId,
        Delta = -(bottling.Count * bottling.BottleSize),
        BottleDelta = bottling.Count,
        Source = WineMovementSource.Bottling,
        Date = bottling.Date,
        WineBottlingId = bottling.Id,
    };

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();
}
