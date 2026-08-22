namespace Server.Models;

public record CreatePurchaseRequest(
    string Seller,
    DateOnly? Date,
    string? Note,
    List<CreatePurchaseItemRequest> Items);
