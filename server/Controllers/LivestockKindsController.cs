using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockKindsController(
    ILivestockKindRepository livestockKindRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LivestockKind>>> GetAll()
    {
        return Ok(await livestockKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<LivestockKind>> Create(LivestockKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        if (await livestockKindRepository.ExistsByNameAsync(name))
        {
            return Conflict("A livestock type with this name already exists.");
        }

        return Ok(await livestockKindRepository.AddAsync(name, kind.ImagePath?.Trim() ?? string.Empty));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Read the row first: once it is gone the path to its artwork is gone with it, and
        // the file would sit in uploads/ counting against the owner's storage forever.
        var kind = (await livestockKindRepository.GetAllAsync()).FirstOrDefault(k => k.Id == id);

        var outcome = await livestockKindRepository.DeleteAsync(id);
        if (outcome == DeleteLivestockKindResult.Deleted)
        {
            await fileStorageService.DeleteImageAsync(kind?.ImagePath);
        }

        return outcome switch
        {
            DeleteLivestockKindResult.Deleted => NoContent(),
            DeleteLivestockKindResult.InUse => Conflict("This livestock type is still used by existing groups."),
            DeleteLivestockKindResult.BuiltIn => StatusCode(StatusCodes.Status403Forbidden, "Built-in livestock types can't be deleted."),
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "livestock-kinds");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
