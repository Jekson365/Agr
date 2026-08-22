namespace Server.Models;

public record TreeProductAdjustmentRequest(int TreeProductId, decimal Delta, string? Note = null, DateOnly? Date = null);
