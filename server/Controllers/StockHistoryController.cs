using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockHistoryController(
    IStockHistoryRepository stockHistoryRepository,
    ILivestockRepository livestockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockHistory>>> GetByStock([FromQuery] int stockId)
    {
        return Ok(await stockHistoryRepository.GetByStockAsync(stockId));
    }

    [HttpPost]
    public async Task<ActionResult<StockHistory>> Create(StockHistory history)
    {
        if (await livestockRepository.IsDeletedAsync(null, history.StockId))
        {
            return Conflict(LivestockController.DeletedMessage);
        }

        // The server owns the timestamp so the series can't be back-dated from the client.
        history.CreatedAt = DateTime.UtcNow;
        var created = await stockHistoryRepository.AddAsync(history);
        return Ok(created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await stockHistoryRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
