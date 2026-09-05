namespace Server.Models;

/// <summary>A good's whole grading standard, saved in one write: the bands are read and edited
/// together, so a partial save would leave a standard half old.</summary>
public class AssessmentCriteriaSheet
{
    public int? StockId { get; set; }
    public int? TreeStockId { get; set; }
    public List<AssessmentCriteriaLine> Lines { get; set; } = [];
}

public class AssessmentCriteriaLine
{
    public AssessmentGrade Grade { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal? SizeFrom { get; set; }
    public decimal? SizeTo { get; set; }
    public decimal? WeightFrom { get; set; }
    public decimal? WeightTo { get; set; }
    public decimal? Damaged { get; set; }
    public decimal? Rotten { get; set; }
    public decimal? Moisture { get; set; }
    public string Color { get; set; } = string.Empty;
}
