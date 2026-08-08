using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockDetailsController(
    ILivestockDetailRepository livestockDetailRepository,
    IAnimalProductionRepository animalProductionRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    /// <summary>
    /// A group's animals, or every animal on the farm when no group is named — which is what a
    /// family tree needs, since an animal's offspring are routinely put in a different group from
    /// its own.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LivestockDetail>>> GetByLivestock([FromQuery] int? livestockId)
    {
        return Ok(livestockId is int groupId
            ? await livestockDetailRepository.GetByLivestockAsync(groupId)
            : await livestockDetailRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LivestockDetail>> GetById(int id)
    {
        var detail = await livestockDetailRepository.GetByIdAsync(id);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<LivestockDetail>> Create(LivestockDetail detail)
    {
        var created = await livestockDetailRepository.AddAsync(detail);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, LivestockDetail detail)
    {
        if (id != detail.Id)
        {
            return BadRequest();
        }

        var existing = await livestockDetailRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        var oldImagePath = existing.ImagePath;

        var updated = await livestockDetailRepository.UpdateAsync(detail);
        if (!updated)
        {
            return NotFound();
        }

        if (oldImagePath != detail.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await livestockDetailRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // Its production records cascade with it — see the matching guard in LivestockController.
        if (await animalProductionRepository.ExistsForAnimalAsync(id))
        {
            return Conflict("This animal still has production records. Remove them first.");
        }

        var deleted = await livestockDetailRepository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        await fileStorageService.DeleteImageAsync(existing.ImagePath);
        return NoContent();
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "livestock");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
