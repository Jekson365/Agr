using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SeedMovementsController(ISeedMovementRepository seedMovementRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SeedMovement>>> GetBySeed([FromQuery] int seedId)
    {
        return Ok(await seedMovementRepository.GetBySeedAsync(seedId));
    }
}
