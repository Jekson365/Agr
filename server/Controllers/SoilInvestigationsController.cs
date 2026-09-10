using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SoilInvestigationsController(
    ISoilInvestigationRepository soilInvestigationRepository,
    ISoilFertilityScoringService scoringService,
    IFileStorageService fileStorageService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SoilInvestigation>>> GetByPlot([FromQuery] int landPlotId)
    {
        return Ok(await soilInvestigationRepository.GetByPlotAsync(landPlotId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SoilInvestigationDetail>> GetById(int id)
    {
        var detail = await soilInvestigationRepository.GetDetailAsync(id);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<SoilInvestigationDetail>> Create(SoilInvestigationDetail detail)
    {
        if (Validate(detail) is string error)
        {
            return BadRequest(error);
        }

        detail.Investigation.Id = 0;
        detail.Investigation.CreatedAt = DateTime.UtcNow;
        var created = await soilInvestigationRepository.AddAsync(detail.Investigation, detail.Results);
        await scoringService.CalculateAsync(created.Investigation.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Investigation.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SoilInvestigationDetail>> Update(int id, SoilInvestigationDetail detail)
    {
        if (id != detail.Investigation.Id)
        {
            return BadRequest();
        }

        if (Validate(detail) is string error)
        {
            return BadRequest(error);
        }

        var existing = await soilInvestigationRepository.GetDetailAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (existing.Investigation.Status == SoilInvestigationStatus.Archived)
        {
            return Conflict("An archived investigation is a closed record and can no longer be edited.");
        }

        var updated = await soilInvestigationRepository.UpdateAsync(detail.Investigation, detail.Results);
        if (updated is null)
        {
            return NotFound();
        }

        await scoringService.CalculateAsync(id);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await soilInvestigationRepository.DeleteAsync(id);
        if (deleted is null)
        {
            return NotFound();
        }

        await fileStorageService.DeleteImageAsync(deleted.ReportPath);
        return NoContent();
    }

    [HttpPost("upload-report")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UploadReport(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            var imagePath = await fileStorageService.SaveDocumentAsync(file, "soil-reports");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static string? Validate(SoilInvestigationDetail detail)
    {
        if (detail.Investigation.LandPlotId <= 0)
        {
            return "A soil investigation must belong to a land plot.";
        }

        if (detail.Investigation.SamplingDepthCm is decimal depth && depth <= 0)
        {
            return "Sampling depth must be greater than zero.";
        }

        var keys = detail.Results.Select(r => (r.ParameterId, r.Form)).ToList();
        return keys.Count != keys.Distinct().Count()
            ? "Each parameter and form may be recorded once per investigation."
            : null;
    }
}
