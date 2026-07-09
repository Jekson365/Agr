using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockKindsController(IStockKindRepository stockKindRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockKind>>> GetAll()
    {
        return Ok(await stockKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<StockKind>> Create(StockKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        return Ok(await stockKindRepository.AddAsync(name));
    }
}
