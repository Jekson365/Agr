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
            await planLimitService.EnsureCanAddLandAsync(await ActiveLandCountAsync());
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
            await planLimitService.EnsureLandWithinLimitAsync(await ActiveLandCountAsync());
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

        // Removed land is out of use, so it takes no more edits — restoring it is what puts it
        // back within reach.
        if (existing.IsRemoved)
        {
            return Conflict(RemovedMessage);
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

    /// <summary>
    /// Takes land out of use. It is marked, never dropped — the plots, herds and harvests recorded
    /// on it cascade off the row, and it stays on the land page as a disabled card so all of them
    /// still have their explanation. Its picture is kept for the same reason: the card still shows
    /// it, and restoring is meant to give the land back as it was.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await farmRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (existing.IsRemoved)
        {
            return Conflict(RemovedMessage);
        }

        return await farmRepository.SetRemovedAsync(id, true) ? NoContent() : NotFound();
    }

    /// <summary>Puts removed land back into use. Refused when that would take the owner past the
    /// land their plan allows, since a removed piece stopped counting while it was out.</summary>
    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var existing = await farmRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (!existing.IsRemoved)
        {
            return Conflict("This land is already in use.");
        }

        try
        {
            await planLimitService.EnsureCanAddLandAsync(await ActiveLandCountAsync());
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        return await farmRepository.SetRemovedAsync(id, false) ? NoContent() : NotFound();
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
            await planLimitService.EnsureLandWithinLimitAsync(await ActiveLandCountAsync());
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

    private const string RemovedMessage = "This land has been removed and is no longer in use.";

    /// <summary>
    /// The land that counts against the plan. Removed land is out of use, so it does not — the same
    /// rule the other marked-removed rows follow, and what makes restoring worth checking.
    /// </summary>
    private async Task<int> ActiveLandCountAsync() =>
        (await farmRepository.GetAllAsync()).Count(farm => !farm.IsRemoved);

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);
}
