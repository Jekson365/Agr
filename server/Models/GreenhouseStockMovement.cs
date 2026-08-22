namespace Server.Models;

public class GreenhouseStockMovement
{
    public int Id { get; set; }
    public int GreenhouseStockId { get; set; }

    public decimal Delta { get; set; }
    public StockMovementSource Source { get; set; }

    public string? Note { get; set; }

    public DateOnly? Date { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
