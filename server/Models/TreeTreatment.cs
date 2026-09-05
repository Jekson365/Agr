namespace Server.Models;

public class TreeTreatment
{
    public int Id { get; set; }

    public int TreeStockId { get; set; }

    public DateOnly Date { get; set; }

    public string Type { get; set; } = string.Empty;
}
