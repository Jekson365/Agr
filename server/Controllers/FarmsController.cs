using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FarmsController(IFarmRepository farmRepository, IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Farm>>> GetAll()
    {
        return Ok(await farmRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Farm>> GetById(int id)
    {
        var farm = await farmRepository.GetByIdAsync(id);
        return farm is null ? NotFound() : Ok(farm);
    }

    [HttpPost]
    public async Task<ActionResult<Farm>> Create(Farm farm)
    {
        var created = await farmRepository.AddAsync(farm);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Farm farm)
    {
        if (id != farm.Id)
        {
            return BadRequest();
        }

        var updated = await farmRepository.UpdateAsync(farm);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await farmRepository.DeleteAsync(id);
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "farms");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
