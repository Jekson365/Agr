namespace Server.Models;

public record CreatePurchaseItemRequest(
    PurchaseItemKind Kind,
    int TargetId,
    int? UnitId,
    decimal Quantity,
    decimal Price);
