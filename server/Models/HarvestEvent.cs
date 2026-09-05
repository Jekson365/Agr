namespace Server.Models;

/// <summary>
/// A dated note against a <see cref="Harvest"/> — what happened on one day of it. Belongs to the
/// harvest and goes with it, unlike a <see cref="CalendarEvent"/>, which is the farm's own diary.
/// Moves no balance: it is a record, not an operation.
/// </summary>
public class HarvestEvent
{
    public int Id { get; set; }
    public int HarvestId { get; set; }
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
}
