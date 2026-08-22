using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeStockMovementsController(
    ITreeStockMovementRepository treeStockMovementRepository,
    ITreeStockRepository treeStockRepository,
    IMarketListingRepository marketListingRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeStockMovement>>> GetByTreeStock([FromQuery] int treeStockId)
    {
        return Ok(await treeStockMovementRepository.GetByTreeStockAsync(treeStockId));
    }

    [HttpPost]
    public async Task<ActionResult<TreeStockMovement>> Create(TreeStockAdjustmentRequest request)
    {
        if (request.Delta == 0)
        {
            return BadRequest("Delta must be non-zero.");
        }

        var treeStock = await treeStockRepository.GetByIdAsync(request.TreeStockId);
        if (treeStock is null)
        {
            return NotFound();
        }
        if (treeStock.IsDeleted)
        {
            return Conflict("This fruit was removed.");
        }
        if (treeStock.Amount + request.Delta < 0)
        {
            return Conflict($"Only {treeStock.Amount} of this fruit is available.");
        }

        await treeStockRepository.AdjustAmountRawAsync(request.TreeStockId, request.Delta);

        var created = await treeStockMovementRepository.AddAsync(new TreeStockMovement
        {
            TreeStockId = request.TreeStockId,
            Delta = request.Delta,
            Source = StockMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date,
        });
        return Ok(created);
    }

    /// <summary>Deletes a movement and reverses its effect on the tree stock's amount, so the
    /// remaining history still explains the balance. Harvest movements are refused — they are
    /// managed by their harvest item/result and would silently desync from it.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var movement = await treeStockMovementRepository.GetByIdAsync(id);
        if (movement is null)
        {
            return NotFound();
        }
        if (movement.Source == StockMovementSource.Harvest)
        {
            return BadRequest("Harvest movements are managed by their harvest records.");
        }

        await treeStockMovementRepository.DeleteAsync(id);
        await treeStockRepository.AdjustAmountRawAsync(movement.TreeStockId, -movement.Delta);

        // Same as the plant-stock side: undoing a sale reopens the listing it was sold from.
        if (movement.MarketListingId is not null)
        {
            await marketListingRepository.RestoreAfterSaleAsync(movement.MarketListingId.Value, -movement.Delta);
        }

        return NoContent();
    }
}
