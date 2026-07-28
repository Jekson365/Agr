using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseFloorsController(
    IGreenhouseFloorRepository greenhouseFloorRepository,
    IGreenhouseRepository greenhouseRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseFloor>>> GetByGreenhouse([FromQuery] int greenhouseId)
    {
        return Ok(await greenhouseFloorRepository.GetByGreenhouseAsync(greenhouseId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseFloor>> Create(GreenhouseFloor floor)
    {
        if (string.IsNullOrWhiteSpace(floor.Name))
        {
            return BadRequest("A floor needs a name.");
        }
        if (await greenhouseRepository.GetByIdAsync(floor.GreenhouseId) is null)
        {
            return BadRequest("That greenhouse does not exist.");
        }

        floor.Name = floor.Name.Trim();
        var created = await greenhouseFloorRepository.AddAsync(floor);
        return CreatedAtAction(nameof(GetByGreenhouse), new { greenhouseId = created.GreenhouseId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseFloor floor)
    {
        if (id != floor.Id)
        {
            return BadRequest();
        }
        if (string.IsNullOrWhiteSpace(floor.Name))
        {
            return BadRequest("A floor needs a name.");
        }

        floor.Name = floor.Name.Trim();
        var updated = await greenhouseFloorRepository.UpdateAsync(floor);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var floor = await greenhouseFloorRepository.GetByIdAsync(id);
        if (floor is null)
        {
            return NotFound();
        }

        // A greenhouse's layout always needs somewhere to put sections — removing the last floor
        // would leave the editor with nothing to show.
        var siblingCount = (await greenhouseFloorRepository.GetByGreenhouseAsync(floor.GreenhouseId)).Count();
        if (siblingCount <= 1)
        {
            return Conflict("A greenhouse needs at least one floor.");
        }

        // Its sections cascade away with it — deleting a floor is deleting its whole layout.
        var deleted = await greenhouseFloorRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
