namespace Server.Models;

/// <summary>A user-created note attached to a single day on the farm calendar.</summary>
public class CalendarEvent
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
}
