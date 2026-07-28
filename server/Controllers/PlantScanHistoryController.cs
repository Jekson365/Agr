using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PlantScanHistoryController(
    IPlantScanHistoryRepository plantScanHistoryRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlantScanHistory>>> GetAll()
    {
        return Ok(await plantScanHistoryRepository.GetAllAsync());
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await plantScanHistoryRepository.DeleteAsync(id);
        if (deleted is null)
        {
            return NotFound();
        }

        await fileStorageService.DeleteImageAsync(deleted.ImagePath);
        return NoContent();
    }
}
