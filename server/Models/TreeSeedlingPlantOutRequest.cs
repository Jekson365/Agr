namespace Server.Models;

public class TreeSeedlingPlantOutRequest
{
    public int TreeStockId { get; set; }

    public int Quantity { get; set; }

    public DateOnly? Date { get; set; }

    public string? Note { get; set; }
}
