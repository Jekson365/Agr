namespace Server.Models;

/// <summary>
/// A weight reading for a single animal (<see cref="LivestockDetail"/>), recorded at a point in
/// time. The series of readings shows how much weight the animal has gained.
/// </summary>
public class StockHistory
{
    public int Id { get; set; }
    public int StockId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public decimal Weight { get; set; }
}
