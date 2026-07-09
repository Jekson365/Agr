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
}
