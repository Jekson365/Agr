using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EquipmentController(
    IEquipmentRepository equipmentRepository,
    IFileStorageService fileStorageService,
    IPlanLimitService planLimitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Equipment>>> GetAll()
    {
        try
        {
            await planLimitService.EnsureEquipmentAllowedAsync();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok(await equipmentRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Equipment>> GetById(int id)
    {
        var equipment = await equipmentRepository.GetByIdAsync(id);
        return equipment is null ? NotFound() : Ok(equipment);
    }

    [HttpPost]
    public async Task<ActionResult<Equipment>> Create(Equipment equipment)
    {
        try
        {
            await planLimitService.EnsureEquipmentAllowedAsync();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var created = await equipmentRepository.AddAsync(equipment);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Equipment equipment)
    {
        if (id != equipment.Id)
        {
            return BadRequest();
        }

        var existing = await equipmentRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        var oldImagePath = existing.ImagePath;

        var updated = await equipmentRepository.UpdateAsync(equipment);
        if (!updated)
        {
            return NotFound();
        }

        if (oldImagePath != equipment.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await equipmentRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        var deleted = await equipmentRepository.DeleteAsync(id);
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
            var imagePath = await fileStorageService.SaveImageAsync(file, "equipment");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
