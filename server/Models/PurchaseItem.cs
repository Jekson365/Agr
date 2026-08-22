namespace Server.Models;

public enum PurchaseItemKind
{
    Livestock,
    LivestockProduction,
    TreeStock,
    TreeProduct,
    Stock,
    Seed,
    Equipment,
}

public class PurchaseItem
{
    public int Id { get; set; }
    public int PurchaseDocumentId { get; set; }

    public PurchaseItemKind Kind { get; set; }

    public int TargetId { get; set; }

    public int? UnitId { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public decimal Price { get; set; }

    public int? MovementId { get; set; }
}
