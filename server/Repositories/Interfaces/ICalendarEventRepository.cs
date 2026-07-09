using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ICalendarEventRepository
{
    Task<IEnumerable<CalendarEvent>> GetAllAsync();
    Task<CalendarEvent?> GetByIdAsync(int id);
    Task<CalendarEvent> AddAsync(CalendarEvent calendarEvent);
    Task<bool> UpdateAsync(CalendarEvent calendarEvent);
    Task<bool> DeleteAsync(int id);
}
