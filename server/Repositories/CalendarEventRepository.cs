using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class CalendarEventRepository(AppDbContext context) : ICalendarEventRepository
{
    public async Task<IEnumerable<CalendarEvent>> GetAllAsync()
    {
        return await context.CalendarEvents.AsNoTracking().OrderBy(e => e.Date).ThenBy(e => e.Time).ToListAsync();
    }

    public async Task<CalendarEvent?> GetByIdAsync(int id)
    {
        return await context.CalendarEvents.FindAsync(id);
    }

    public async Task<CalendarEvent> AddAsync(CalendarEvent calendarEvent)
    {
        context.CalendarEvents.Add(calendarEvent);
        await context.SaveChangesAsync();
        return calendarEvent;
    }

    public async Task<bool> UpdateAsync(CalendarEvent calendarEvent)
    {
        var existing = await context.CalendarEvents.FindAsync(calendarEvent.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Title = calendarEvent.Title;
        existing.Date = calendarEvent.Date;
        existing.Time = calendarEvent.Time;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.CalendarEvents.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.CalendarEvents.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
