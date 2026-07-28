using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductionTypesController(IProductionTypeRepository productionTypeRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionType>>> GetAll()
    {
        return Ok(await productionTypeRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<ProductionType>> Create(ProductionType type)
    {
        var name = type.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        if (await productionTypeRepository.ExistsByNameAsync(name))
        {
            return Conflict("A production type with this name already exists.");
        }

        return Ok(await productionTypeRepository.AddAsync(name));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await productionTypeRepository.DeleteAsync(id) switch
        {
            DeleteProductionTypeResult.Deleted => NoContent(),
            DeleteProductionTypeResult.InUse => Conflict("This production type is still used by existing records."),
            _ => NotFound(),
        };
    }
}
