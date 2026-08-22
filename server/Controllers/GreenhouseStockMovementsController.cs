using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseStockMovementsController(
    IGreenhouseStockMovementRepository greenhouseStockMovementRepository,
    IGreenhouseStockRepository greenhouseStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseStockMovement>>> Get([FromQuery] int? greenhouseStockId)
    {
        return Ok(await greenhouseStockMovementRepository.GetAsync(greenhouseStockId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseStockMovement>> Create(GreenhouseStockAdjustmentRequest request)
    {
        if (request.Delta == 0)
        {
            return BadRequest("Delta must be non-zero.");
        }

        var stock = await greenhouseStockRepository.GetByIdAsync(request.GreenhouseStockId);
        if (stock is null)
        {
            return NotFound();
        }
        if (stock.Amount + request.Delta < 0)
        {
            return Conflict($"Only {stock.Amount} of this stock is available.");
        }

        await greenhouseStockRepository.AdjustAmountRawAsync(request.GreenhouseStockId, request.Delta);

        var created = await greenhouseStockMovementRepository.AddAsync(new GreenhouseStockMovement
        {
            GreenhouseStockId = request.GreenhouseStockId,
            Delta = request.Delta,
            Source = StockMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date,
        });
        return Ok(created);
    }
}
