using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeStockMovementsController(ITreeStockMovementRepository treeStockMovementRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeStockMovement>>> GetByTreeStock([FromQuery] int treeStockId)
    {
        return Ok(await treeStockMovementRepository.GetByTreeStockAsync(treeStockId));
    }
}
