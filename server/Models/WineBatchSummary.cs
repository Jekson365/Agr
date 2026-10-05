namespace Server.Models;

public class WineBatchSummary
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Vintage { get; set; }
    public WineColor Color { get; set; }
    public WineMethod Method { get; set; }
    public WineStage Stage { get; set; }
    public DateOnly StartDate { get; set; }
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; }
    public decimal GrapeKg { get; set; }
    public decimal ProducedLiters { get; set; }
    public decimal Liters { get; set; }
    public int Bottles { get; set; }
    public decimal? LatestSugar { get; set; }
    public decimal? LatestAlcohol { get; set; }
    public DateOnly? LatestMeasuredOn { get; set; }
    public int ReadingCount { get; set; }
    public int BottlingCount { get; set; }
    public int OperationCount { get; set; }
    public int BottledCount { get; set; }
    public decimal Costs { get; set; }
    public decimal Revenue { get; set; }
}
