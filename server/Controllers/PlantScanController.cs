using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Integrations.OpenAi;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PlantScanController(
    IPlantScanClient plantScanClient,
    IPlanLimitService planLimitService,
    IPlantScanHistoryRepository plantScanHistoryRepository,
    IFileStorageService fileStorageService) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp",
    };

    /// <summary>Analyzes a photo of a plant and returns an AI-generated disease/treatment diagnosis.</summary>
    /// <param name="language">UI language the diagnosis text should be written in ("ka" or "en").</param>
    [HttpPost("analyze")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<PlantScanResult>> Analyze(
        IFormFile file,
        [FromForm] string? language,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("No image uploaded.");
        }
        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest("Unsupported image type. Use JPEG, PNG, or WEBP.");
        }

        try
        {
            await planLimitService.EnsureCanScanAsync();
        }
        catch (InvalidOperationException ex)
        {
            // Daily scan quota reached for the user's plan.
            return StatusCode(StatusCodes.Status429TooManyRequests, ex.Message);
        }

        PlantScanResult result;
        try
        {
            await using var stream = file.OpenReadStream();
            result = await plantScanClient.AnalyzeAsync(stream, file.ContentType, language, cancellationToken);
            // Only counts against the daily quota once a scan actually succeeds.
            await planLimitService.RecordScanUsedAsync();
        }
        catch (OpenAiException ex)
        {
            // Upstream (OpenAI) problem — surface as a bad gateway, not a 500.
            return StatusCode(StatusCodes.Status502BadGateway, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            // Misconfiguration (e.g. missing API key).
            return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
        }

        // Best-effort: save the photo + diagnosis to history so it can be browsed later. A
        // successful scan should still be returned to the user even if this fails (e.g. the
        // user is over their storage quota) — history is a convenience, not the core feature.
        try
        {
            var imagePath = await fileStorageService.SaveImageAsync(file, "plant-scans");
            await plantScanHistoryRepository.AddAsync(new PlantScanHistory
            {
                ImagePath = imagePath,
                PlantDetected = result.PlantDetected,
                PlantName = result.PlantName,
                IsHealthy = result.IsHealthy,
                DiseaseName = result.DiseaseName,
                Severity = result.Severity,
                Confidence = result.Confidence,
                Summary = result.Summary,
                Symptoms = result.Symptoms,
                Treatments = result.Treatments,
                PreventionTips = result.PreventionTips,
            });
        }
        catch
        {
            // Swallowed intentionally — see comment above.
        }

        return Ok(result);
    }
}
