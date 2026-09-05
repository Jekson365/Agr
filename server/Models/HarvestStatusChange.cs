namespace Server.Models;

public class HarvestStatusChange
{
    public int Id { get; set; }

    public int HarvestId { get; set; }

    public HarvestStatus? FromStatus { get; set; }

    public HarvestStatus ToStatus { get; set; }

    public DateOnly Date { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
