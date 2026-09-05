namespace Server.Models;

public class TreeSeedling
{
    public int Id { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public NurseryStage Stage { get; set; } = NurseryStage.Sown;

    public DateOnly SownDate { get; set; }

    public DateOnly? SproutedDate { get; set; }

    public DateOnly? HardeningDate { get; set; }

    public DateOnly? ReadyDate { get; set; }

    public DateOnly? PlantedOutDate { get; set; }

    public string Location { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public int? TreeStockId { get; set; }

    public int PlantedOutQuantity { get; set; }
}
