using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockMovementsController(IStockMovementRepository stockMovementRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockMovement>>> GetByStock([FromQuery] int stockId)
    {
        return Ok(await stockMovementRepository.GetByStockAsync(stockId));
    }
}
