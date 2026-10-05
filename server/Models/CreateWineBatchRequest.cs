namespace Server.Models;

public class CreateWineBatchRequest
{
    public string Name { get; set; } = string.Empty;
    public int Vintage { get; set; }
    public WineColor Color { get; set; }
    public WineMethod Method { get; set; }
    public DateOnly StartDate { get; set; }
    public string? Notes { get; set; }
    public decimal Liters { get; set; }
    public List<WineGrapeLine> Grapes { get; set; } = [];
}
