using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CalendarEventsController(ICalendarEventRepository calendarEventRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CalendarEvent>>> GetAll()
    {
        return Ok(await calendarEventRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CalendarEvent>> GetById(int id)
    {
        var calendarEvent = await calendarEventRepository.GetByIdAsync(id);
        return calendarEvent is null ? NotFound() : Ok(calendarEvent);
    }

    [HttpPost]
    public async Task<ActionResult<CalendarEvent>> Create(CalendarEvent calendarEvent)
    {
        var created = await calendarEventRepository.AddAsync(calendarEvent);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CalendarEvent calendarEvent)
    {
        if (id != calendarEvent.Id)
        {
            return BadRequest();
        }

        var updated = await calendarEventRepository.UpdateAsync(calendarEvent);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await calendarEventRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
