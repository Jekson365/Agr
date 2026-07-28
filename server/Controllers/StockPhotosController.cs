using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockPhotosController(
    IStockPhotoRepository stockPhotoRepository,
    IFileStorageService fileStorageService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockPhoto>>> GetByStock([FromQuery] int stockId)
    {
        return Ok(await stockPhotoRepository.GetByStockAsync(stockId));
    }

    [HttpPost]
    public async Task<ActionResult<StockPhoto>> Create(StockPhoto photo)
    {
        // The server owns the upload timestamp; TakenAt stays whatever date the caller assigned.
        photo.CreatedAt = DateTime.UtcNow;
        var created = await stockPhotoRepository.AddAsync(photo);
        return Ok(created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await stockPhotoRepository.DeleteAsync(id);
        if (deleted is null)
        {
            return NotFound();
        }

        await fileStorageService.DeleteImageAsync(deleted.ImagePath);
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "stock-photos");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
