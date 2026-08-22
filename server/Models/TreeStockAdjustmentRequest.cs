namespace Server.Models;

public record TreeStockAdjustmentRequest(int TreeStockId, decimal Delta, string? Note = null, DateOnly? Date = null);
