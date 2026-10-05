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
public class WineOperationsController(
    AppDbContext context,
    IWineRecordRepository<WineOperation> repository,
    IWineMovementRepository movementRepository,
    IWineBatchRepository batchRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineOperation>>> Get([FromQuery] int? wineBatchId)
    {
        return Ok(await repository.GetAsync(wineBatchId));
    }

    [HttpPost]
    public async Task<ActionResult<WineOperation>> Create(WineOperation operation)
    {
        if (await CheckAsync(operation.WineBatchId, operation, null) is { } problem)
        {
            return problem;
        }

        operation.Id = 0;
        operation.Note = Clean(operation.Note);
        await using var transaction = await context.Database.BeginTransactionAsync();
        var created = await repository.AddAsync(operation);
        if (created.LitersLost > 0)
        {
            await movementRepository.AddAsync(LossFor(created));
        }
        await transaction.CommitAsync();
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, WineOperation operation)
    {
        if (id != operation.Id)
        {
            return BadRequest();
        }

        var existing = await repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        var movement = await context.WineMovements.FirstOrDefaultAsync(m => m.WineOperationId == id);
        if (await CheckAsync(existing.WineBatchId, operation, movement?.Id) is { } problem)
        {
            return problem;
        }

        existing.Date = operation.Date;
        existing.Kind = operation.Kind;
        existing.Note = Clean(operation.Note);
        existing.Cost = operation.Cost;
        existing.LitersLost = operation.LitersLost;

        if (existing.LitersLost > 0 && movement is null)
        {
            context.WineMovements.Add(LossFor(existing));
        }
        else if (existing.LitersLost > 0 && movement is not null)
        {
            movement.Delta = -existing.LitersLost.Value;
            movement.Date = existing.Date;
        }
        else if (movement is not null)
        {
            context.WineMovements.Remove(movement);
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

        await repository.DeleteAsync(existing);
        return NoContent();
    }

    private async Task<ActionResult?> CheckAsync(int wineBatchId, WineOperation operation, int? ownMovementId)
    {
        if (!Enum.IsDefined(operation.Kind))
        {
            return BadRequest("Unknown kind of work.");
        }
        if (operation.Cost < 0 || operation.LitersLost < 0)
        {
            return BadRequest("Cost and loss cannot be negative.");
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

        var (liters, _) = await movementRepository.GetBalanceAsync(wineBatchId, ownMovementId);
        return (operation.LitersLost ?? 0) > liters ? Conflict($"Only {liters} L are in the cellar.") : null;
    }

    private static WineMovement LossFor(WineOperation operation) => new()
    {
        WineBatchId = operation.WineBatchId,
        Delta = -(operation.LitersLost ?? 0),
        Source = WineMovementSource.Loss,
        Date = operation.Date,
        WineOperationId = operation.Id,
    };

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();
}
