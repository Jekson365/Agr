using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UnitsController(IUnitRepository unitRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Unit>>> GetAll()
    {
        return Ok(await unitRepository.GetAllAsync());
    }
}
