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

        if (await stockKindRepository.ExistsByNameAsync(name))
        {
            return Conflict("A stock type with this name already exists.");
        }

        return Ok(await stockKindRepository.AddAsync(name));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await stockKindRepository.DeleteAsync(id) switch
        {
            DeleteStockKindResult.Deleted => NoContent(),
            DeleteStockKindResult.InUse => Conflict("This stock type is still used by existing stock or seeds."),
            _ => NotFound(),
        };
    }
}
