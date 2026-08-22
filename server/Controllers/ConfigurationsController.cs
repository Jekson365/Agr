using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
/// <summary>
/// A tenant's feature switches, read-only from here. Which areas an account has is settled by the
/// platform operator, not by the account itself — writing one goes through
/// <c>PUT /api/admin/users/{id}/configurations/{name}</c>, which re-checks
/// <see cref="User.IsSuperAdmin"/> against the master database on every call.
/// </summary>
public class ConfigurationsController(IConfigurationRepository configurationRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Configuration>>> GetAll()
    {
        return Ok(await configurationRepository.GetAllAsync());
    }

}
