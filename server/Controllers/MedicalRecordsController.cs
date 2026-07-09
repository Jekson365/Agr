using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MedicalRecordsController(IMedicalRecordRepository medicalRecordRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MedicalRecord>>> GetByStock([FromQuery] int stockId)
    {
        return Ok(await medicalRecordRepository.GetByStockAsync(stockId));
    }

    [HttpPost]
    public async Task<ActionResult<MedicalRecord>> Create(MedicalRecord record)
    {
        // The server owns the audit timestamp; VisitDate (when the visit happened) is client-supplied.
        record.CreatedAt = DateTime.UtcNow;

        // The client sends plain dates (Kind=Unspecified), but Npgsql requires Kind=Utc for
        // "timestamp with time zone" columns.
        record.VisitDate = DateTime.SpecifyKind(record.VisitDate, DateTimeKind.Utc);
        if (record.FollowUpDate.HasValue)
        {
            record.FollowUpDate = DateTime.SpecifyKind(record.FollowUpDate.Value, DateTimeKind.Utc);
        }

        var created = await medicalRecordRepository.AddAsync(record);
        return Ok(created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await medicalRecordRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
