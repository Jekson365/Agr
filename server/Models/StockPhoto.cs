namespace Server.Models;

/// <summary>A photo of a <see cref="Stock"/>, tagged with the date it was actually taken (which
/// may differ from <see cref="CreatedAt"/>, the upload time).</summary>
public class StockPhoto
{
    public int Id { get; set; }
    public int StockId { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public DateOnly TakenAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
