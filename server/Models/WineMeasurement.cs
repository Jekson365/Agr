namespace Server.Models;

public class WineMeasurement
{
    public int Id { get; set; }
    public int WineBatchId { get; set; }
    public DateOnly Date { get; set; }
    public decimal? Sugar { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Alcohol { get; set; }
    public decimal? Acidity { get; set; }
    public decimal? Ph { get; set; }
    public decimal? FreeSo2 { get; set; }
    public decimal? TotalSo2 { get; set; }
    public string? Note { get; set; }
}
