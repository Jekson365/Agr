namespace Server.Models;

public class WineBatch
{
    public const decimal LitersPerKg = 0.65m;

    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Vintage { get; set; }
    public WineColor Color { get; set; }
    public WineMethod Method { get; set; }
    public WineStage Stage { get; set; } = WineStage.Fermenting;
    public DateOnly StartDate { get; set; }
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
