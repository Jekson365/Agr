namespace Server.Models;

public record ProductionAdjustmentRequest(
    int ProductionTypeId,
    int UnitId,
    decimal Delta,
    string? Note = null,
    DateOnly? Date = null);
