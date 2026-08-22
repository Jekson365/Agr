using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockMovementsController(
    IStockMovementRepository stockMovementRepository,
    IStockRepository stockRepository,
    IMarketListingRepository marketListingRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockMovement>>> GetByStock([FromQuery] int stockId)
    {
        return Ok(await stockMovementRepository.GetByStockAsync(stockId));
    }

    [HttpPost]
    public async Task<ActionResult<StockMovement>> Create(StockAdjustmentRequest request)
    {
        if (request.Delta == 0)
        {
            return BadRequest("Delta must be non-zero.");
        }

        var stock = await stockRepository.GetByIdAsync(request.StockId);
        if (stock is null)
        {
            return NotFound();
        }
        if (stock.IsDeleted)
        {
            return Conflict("This stock has been removed.");
        }
        if (stock.Amount + request.Delta < 0)
        {
            return Conflict($"Only {stock.Amount} of this stock is available.");
        }

        await stockRepository.AdjustAmountRawAsync(request.StockId, request.Delta);

        var created = await stockMovementRepository.AddAsync(new StockMovement
        {
            StockId = request.StockId,
            Delta = request.Delta,
            Source = StockMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date,
        });
        return Ok(created);
    }

    /// <summary>Deletes a movement and reverses its effect on the stock's amount, so the
    /// remaining history still explains the balance. A sale also puts the marketplace listing it
    /// came from back the way it was, leaving nothing behind that still says it sold. Harvest
    /// movements are refused — they are managed by their harvest item/result and would silently
    /// desync from it.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var movement = await stockMovementRepository.GetByIdAsync(id);
        if (movement is null)
        {
            return NotFound();
        }
        if (movement.Source == StockMovementSource.Harvest)
        {
            return BadRequest("Harvest movements are managed by their harvest records.");
        }

        await stockMovementRepository.DeleteAsync(id);
        await stockRepository.AdjustAmountRawAsync(movement.StockId, -movement.Delta);

        if (movement.MarketListingId is not null)
        {
            // A listing since edited or deleted just stays as it is — the stock is already
            // corrected, and failing here would leave the caller unable to retry.
            await marketListingRepository.RestoreAfterSaleAsync(movement.MarketListingId.Value, -movement.Delta);
        }

        return NoContent();
    }
}
