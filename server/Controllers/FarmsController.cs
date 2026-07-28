using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FarmsController(
    IFarmRepository farmRepository,
    IFileStorageService fileStorageService,
    IPlanLimitService planLimitService) : ControllerBase
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
        try
        {
            var currentCount = (await farmRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddLandAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

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

        try
        {
            var currentCount = (await farmRepository.GetAllAsync()).Count();
            await planLimitService.EnsureLandWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var existing = await farmRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        var oldImagePath = existing.ImagePath;

        var updated = await farmRepository.UpdateAsync(farm);
        if (!updated)
        {
            return NotFound();
        }

        if (oldImagePath != farm.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await farmRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        var deleted = await farmRepository.DeleteAsync(id);
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

        // The picture is uploaded before the create/update call that references it, so an
        // over-quota user would otherwise burn storage on an image no write can attach.
        try
        {
            var currentCount = (await farmRepository.GetAllAsync()).Count();
            await planLimitService.EnsureLandWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
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

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);
}
