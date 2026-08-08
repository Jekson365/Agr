using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockKindsController(ILivestockKindRepository livestockKindRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LivestockKind>>> GetAll()
    {
        return Ok(await livestockKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<LivestockKind>> Create(LivestockKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        if (await livestockKindRepository.ExistsByNameAsync(name))
        {
            return Conflict("A livestock type with this name already exists.");
        }

        return Ok(await livestockKindRepository.AddAsync(name));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await livestockKindRepository.DeleteAsync(id) switch
        {
            DeleteLivestockKindResult.Deleted => NoContent(),
            DeleteLivestockKindResult.InUse => Conflict("This livestock type is still used by existing groups."),
            DeleteLivestockKindResult.BuiltIn => StatusCode(StatusCodes.Status403Forbidden, "Built-in livestock types can't be deleted."),
            _ => NotFound(),
        };
    }
}
