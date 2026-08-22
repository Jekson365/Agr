namespace Server.Models;

public class PurchaseDocument
{
    public int Id { get; set; }

    public string Seller { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
