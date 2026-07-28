using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseSectionsController(
    IGreenhouseSectionRepository greenhouseSectionRepository,
    IGreenhouseFloorRepository greenhouseFloorRepository,
    IGreenhouseRepository greenhouseRepository,
    IGreenhouseSectionStockRepository greenhouseSectionStockRepository,
    IGreenhouseStockRepository greenhouseStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseSection>>> GetByFloor([FromQuery] int greenhouseFloorId)
    {
        return Ok(await greenhouseSectionRepository.GetByFloorAsync(greenhouseFloorId));
    }

    [HttpPost]
    public async Task<ActionResult<GreenhouseSection>> Create(GreenhouseSection section)
    {
        var invalid = await ValidateAsync(section);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        section.Name = section.Name.Trim();
        var created = await greenhouseSectionRepository.AddAsync(section);
        return CreatedAtAction(nameof(GetByFloor), new { greenhouseFloorId = created.GreenhouseFloorId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseSection section)
    {
        if (id != section.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(section);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        section.Name = section.Name.Trim();
        var updated = await greenhouseSectionRepository.UpdateAsync(section);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseSectionRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// Every section-to-stock planting on one floor in a single call — which stock kinds are
    /// planted in which section, for every section at once (so the canvas can show each one's
    /// icons without a request per section).
    /// </summary>
    [HttpGet("stock")]
    public async Task<ActionResult<IEnumerable<GreenhouseSectionStock>>> GetStockForFloor([FromQuery] int greenhouseFloorId)
    {
        return Ok(await greenhouseSectionStockRepository.GetByFloorAsync(greenhouseFloorId));
    }

    /// <summary>Replaces the full set of stock kinds planted in this section.</summary>
    [HttpPut("{id:int}/stock")]
    public async Task<IActionResult> SetStock(int id, [FromBody] List<int> stockIds)
    {
        var section = await greenhouseSectionRepository.GetByIdAsync(id);
        if (section is null)
        {
            return NotFound();
        }

        var floor = await greenhouseFloorRepository.GetByIdAsync(section.GreenhouseFloorId);
        if (floor is null)
        {
            return NotFound();
        }

        // Only stock that actually belongs to this section's own greenhouse can be planted here.
        var validStockIds = (await greenhouseStockRepository.GetAllAsync(floor.GreenhouseId))
            .Select(s => s.Id)
            .ToHashSet();
        if (stockIds.Any(stockId => !validStockIds.Contains(stockId)))
        {
            return BadRequest("That stock doesn't belong to this greenhouse.");
        }

        await greenhouseSectionStockRepository.SetStockIdsAsync(id, stockIds);
        return NoContent();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseSection section)
    {
        if (string.IsNullOrWhiteSpace(section.Name))
        {
            return "A section needs a name.";
        }
        if (section.Width <= 0 || section.Height <= 0)
        {
            return "Width and height must be positive.";
        }
        if (section.X < 0 || section.Y < 0)
        {
            return "Position cannot be negative.";
        }

        var floor = await greenhouseFloorRepository.GetByIdAsync(section.GreenhouseFloorId);
        if (floor is null)
        {
            return "That floor does not exist.";
        }

        // Bounded by the greenhouse's own footprint, so a section can't be placed or resized
        // outside it — checked against the axis-aligned box only; a rotated section's true swept
        // area isn't computed, so this is an approximation the client should already be honoring.
        var greenhouse = await greenhouseRepository.GetByIdAsync(floor.GreenhouseId);
        if (greenhouse is not null && greenhouse.Width > 0 && greenhouse.Length > 0)
        {
            if (section.X + section.Width > greenhouse.Width || section.Y + section.Height > greenhouse.Length)
            {
                return "That section doesn't fit within the greenhouse's dimensions.";
            }
        }

        return null;
    }
}
