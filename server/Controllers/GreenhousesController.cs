using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhousesController(
    IGreenhouseRepository greenhouseRepository,
    IGreenhouseHarvestRepository greenhouseHarvestRepository,
    IGreenhouseStockRepository greenhouseStockRepository,
    IGreenhouseSeedRepository greenhouseSeedRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Greenhouse>>> GetAll()
    {
        return Ok(await greenhouseRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Greenhouse>> GetById(int id)
    {
        var greenhouse = await greenhouseRepository.GetByIdAsync(id);
        return greenhouse is null ? NotFound() : Ok(greenhouse);
    }

    [HttpPost]
    public async Task<ActionResult<Greenhouse>> Create(Greenhouse greenhouse)
    {
        if (Validate(greenhouse) is string invalid)
        {
            return BadRequest(invalid);
        }

        greenhouse.Name = greenhouse.Name.Trim();
        var created = await greenhouseRepository.AddAsync(greenhouse);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Greenhouse greenhouse)
    {
        if (id != greenhouse.Id)
        {
            return BadRequest();
        }
        if (Validate(greenhouse) is string invalid)
        {
            return BadRequest(invalid);
        }

        greenhouse.Name = greenhouse.Name.Trim();
        var existing = await greenhouseRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        var oldImagePath = existing.ImagePath;

        var updated = await greenhouseRepository.UpdateAsync(greenhouse);
        if (!updated)
        {
            return NotFound();
        }

        // A replaced photo would otherwise sit in storage forever, still counting against the
        // user's quota.
        if (oldImagePath != greenhouse.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await greenhouseRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // Its stock, seed and harvests point at it by id and nothing cascades them, so removing it
        // underneath them would leave rows that no list can resolve. Report it instead.
        if (await greenhouseStockRepository.ExistsForGreenhouseAsync(id))
        {
            return Conflict("This greenhouse still holds stock.");
        }
        if (await greenhouseSeedRepository.ExistsForGreenhouseAsync(id))
        {
            return Conflict("This greenhouse still holds seed.");
        }
        if (await greenhouseHarvestRepository.ExistsForGreenhouseAsync(id))
        {
            return Conflict("This greenhouse still has harvests recorded against it.");
        }

        var deleted = await greenhouseRepository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        await fileStorageService.DeleteImageAsync(existing.ImagePath);
        return NoContent();
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private static string? Validate(Greenhouse greenhouse)
    {
        if (string.IsNullOrWhiteSpace(greenhouse.Name))
        {
            return "A greenhouse needs a name.";
        }
        if (greenhouse.Area < 0)
        {
            return "Area cannot be negative.";
        }
        if (greenhouse.Width < 0 || greenhouse.Length < 0 || greenhouse.Height < 0)
        {
            return "Dimensions cannot be negative.";
        }
        return null;
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            var imagePath = await fileStorageService.SaveImageAsync(file, "greenhouses");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
