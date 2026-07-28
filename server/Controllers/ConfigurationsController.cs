using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConfigurationsController(IConfigurationRepository configurationRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Configuration>>> GetAll()
    {
        return Ok(await configurationRepository.GetAllAsync());
    }

    /// <summary>The new value for a setting. Every setting is a 0/1 flag today.</summary>
    public record SetConfigurationRequest(int Value);

    /// <summary>
    /// Switches one setting on or off. Keyed by name, not id: the client gates on the name, and
    /// ids are per-tenant. A name the tenant has no row for is a 404 rather than a new row —
    /// settings arrive by seeding, so an unknown one is a typo, not a setting.
    /// </summary>
    [HttpPut("{name}")]
    public async Task<ActionResult<Configuration>> Set(string name, SetConfigurationRequest request)
    {
        // Anything non-zero already reads as on; normalising here keeps the stored values to the
        // two the rest of the app expects to see.
        var value = request.Value == 0 ? 0 : 1;
        var updated = await configurationRepository.SetValueAsync(name, value);
        return updated is null ? NotFound() : Ok(updated);
    }
}
