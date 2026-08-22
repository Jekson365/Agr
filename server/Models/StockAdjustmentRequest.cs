namespace Server.Models;

public record StockAdjustmentRequest(int StockId, decimal Delta, string? Note = null, DateOnly? Date = null);
