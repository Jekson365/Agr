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
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LivestockDetail>>> GetByLivestock([FromQuery] int livestockId)
    {
        return Ok(await livestockDetailRepository.GetByLivestockAsync(livestockId));
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

        var updated = await livestockDetailRepository.UpdateAsync(detail);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await livestockDetailRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
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
