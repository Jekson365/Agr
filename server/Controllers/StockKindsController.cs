using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockKindsController(
    IStockKindRepository stockKindRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockKind>>> GetAll()
    {
        return Ok(await stockKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<StockKind>> Create(StockKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        if (await stockKindRepository.ExistsByNameAsync(name))
        {
            return Conflict("A stock type with this name already exists.");
        }

        return Ok(await stockKindRepository.AddAsync(name, kind.ImagePath?.Trim() ?? string.Empty));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Read the row first: once it is gone the path to its artwork is gone with it, and
        // the file would sit in uploads/ counting against the owner's storage forever.
        var kind = (await stockKindRepository.GetAllAsync()).FirstOrDefault(k => k.Id == id);

        var outcome = await stockKindRepository.DeleteAsync(id);
        if (outcome == DeleteStockKindResult.Deleted)
        {
            await fileStorageService.DeleteImageAsync(kind?.ImagePath);
        }

        return outcome switch
        {
            DeleteStockKindResult.Deleted => NoContent(),
            DeleteStockKindResult.InUse => Conflict("This stock type is still used by existing stock or seeds."),
            // Forbidden rather than Conflict: nothing about the farm's data is in the way, the
            // type simply isn't the user's to remove.
            DeleteStockKindResult.BuiltIn => StatusCode(StatusCodes.Status403Forbidden, "Built-in stock types can't be deleted."),
            _ => NotFound(),
        };
    }

    /// <summary>
    /// Artwork for a kind about to be added. Uploaded first, then handed back as <c>imagePath</c>
    /// on the POST that creates the kind — the same two-step the farm and livestock photos use,
    /// since the row does not exist yet when the picture is chosen.
    /// </summary>
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "stock-kinds");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
