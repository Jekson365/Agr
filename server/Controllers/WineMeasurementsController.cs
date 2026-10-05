using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WineMeasurementsController(
    IWineRecordRepository<WineMeasurement> repository,
    IWineBatchRepository batchRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WineMeasurement>>> Get([FromQuery] int? wineBatchId)
    {
        return Ok(await repository.GetAsync(wineBatchId));
    }

    [HttpPost]
    public async Task<ActionResult<WineMeasurement>> Create(WineMeasurement measurement)
    {
        if (await CheckAsync(measurement.WineBatchId, measurement) is { } problem)
        {
            return problem;
        }

        measurement.Id = 0;
        measurement.Note = Clean(measurement.Note);
        return Ok(await repository.AddAsync(measurement));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, WineMeasurement measurement)
    {
        if (id != measurement.Id)
        {
            return BadRequest();
        }

        var existing = await repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (await CheckAsync(existing.WineBatchId, measurement) is { } problem)
        {
            return problem;
        }

        existing.Date = measurement.Date;
        existing.Sugar = measurement.Sugar;
        existing.Temperature = measurement.Temperature;
        existing.Alcohol = measurement.Alcohol;
        existing.Acidity = measurement.Acidity;
        existing.Ph = measurement.Ph;
        existing.FreeSo2 = measurement.FreeSo2;
        existing.TotalSo2 = measurement.TotalSo2;
        existing.Note = Clean(measurement.Note);
        await repository.UpdateAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (await batchRepository.IsDeletedAsync(existing.WineBatchId) == true)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }

        await repository.DeleteAsync(existing);
        return NoContent();
    }

    private async Task<ActionResult?> CheckAsync(int wineBatchId, WineMeasurement m)
    {
        var deleted = await batchRepository.IsDeletedAsync(wineBatchId);
        if (deleted is null)
        {
            return NotFound();
        }
        if (deleted.Value)
        {
            return Conflict(WineBatchesController.DeletedMessage);
        }
        if (m.Sugar is null && m.Temperature is null && m.Alcohol is null && m.Acidity is null
            && m.Ph is null && m.FreeSo2 is null && m.TotalSo2 is null)
        {
            return BadRequest("Record at least one reading.");
        }
        if (Outside(m.Sugar, 0, 40) || Outside(m.Temperature, -10, 60) || Outside(m.Alcohol, 0, 25)
            || Outside(m.Acidity, 0, 30) || Outside(m.Ph, 0, 14) || Outside(m.FreeSo2, 0, 500) || Outside(m.TotalSo2, 0, 500))
        {
            return BadRequest("A reading is out of range.");
        }
        return null;
    }

    private static bool Outside(decimal? value, decimal min, decimal max) => value is decimal v && (v < min || v > max);

    private static string? Clean(string? note) => string.IsNullOrWhiteSpace(note) ? null : note.Trim();
}
