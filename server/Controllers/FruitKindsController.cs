using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FruitKindsController(
    IFruitKindRepository fruitKindRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FruitKind>>> GetAll()
    {
        return Ok(await fruitKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<FruitKind>> Create(FruitKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        if (await fruitKindRepository.ExistsByNameAsync(name))
        {
            return Conflict("A fruit type with this name already exists.");
        }

        return Ok(await fruitKindRepository.AddAsync(name, kind.ImagePath?.Trim() ?? string.Empty));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Read the row first: once it is gone the path to its artwork is gone with it, and
        // the file would sit in uploads/ counting against the owner's storage forever.
        var kind = (await fruitKindRepository.GetAllAsync()).FirstOrDefault(k => k.Id == id);

        var outcome = await fruitKindRepository.DeleteAsync(id);
        if (outcome == DeleteFruitKindResult.Deleted)
        {
            await fileStorageService.DeleteImageAsync(kind?.ImagePath);
        }

        return outcome switch
        {
            DeleteFruitKindResult.Deleted => NoContent(),
            DeleteFruitKindResult.InUse => Conflict("This fruit type is still used by existing tree stock."),
            DeleteFruitKindResult.BuiltIn => StatusCode(StatusCodes.Status403Forbidden, "Built-in fruit types can't be deleted."),
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "fruit-kinds");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
