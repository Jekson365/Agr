using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

/// <summary>
/// Read-only. A seed is not a record kept by hand: it is created with the stock of the crop it
/// grows (<c>POST /api/stocks/with-seed</c>), goes out of use when that stock is removed, and its
/// amount moves only by being sown against a harvest (see <see cref="HarvestSeedsController"/>).
/// Adding, editing or deleting one directly would put it out of step with the stock it belongs to
/// and rewrite what past harvests say was sown, so there is no endpoint for it.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SeedsController(ISeedRepository seedRepository) : ControllerBase
{
    /// <summary>
    /// The seed on hand. Seed removed along with the stock it grows into is left out;
    /// <paramref name="includeDeleted"/> brings it back for the pages naming what a harvest sowed.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Seed>>> GetAll([FromQuery] bool includeDeleted = false)
    {
        return Ok(await seedRepository.GetAllAsync(includeDeleted));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Seed>> GetById(int id)
    {
        var seed = await seedRepository.GetByIdAsync(id);
        return seed is null ? NotFound() : Ok(seed);
    }
}
