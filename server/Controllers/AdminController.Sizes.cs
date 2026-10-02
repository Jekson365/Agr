using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Server.Services.Interfaces;

namespace Server.Controllers;

public partial class AdminController
{
    [HttpGet("users/database-sizes")]
    public async Task<ActionResult<Dictionary<int, long>>> GetDatabaseSizes(
        [FromServices] ITenantDatabaseProvisioner provisioner)
    {
        if (await GetOperatorAsync() is null)
        {
            return Forbid();
        }

        try
        {
            return Ok(await provisioner.GetSizesAsync());
        }
        catch (NpgsqlException ex)
        {
            logger.LogWarning(ex, "Could not read the farm database sizes.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Database sizes are unavailable right now.");
        }
    }
}
