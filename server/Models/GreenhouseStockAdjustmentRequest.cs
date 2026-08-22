namespace Server.Models;

public record GreenhouseStockAdjustmentRequest(
    int GreenhouseStockId,
    decimal Delta,
    string? Note = null,
    DateOnly? Date = null);
