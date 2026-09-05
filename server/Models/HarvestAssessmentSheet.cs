namespace Server.Models;

/// <summary>One good's graded split of one harvest, saved in a single write: the bands are read
/// and edited together, so a partial save would leave a sheet half old.</summary>
public class HarvestAssessmentSheet
{
    public int HarvestId { get; set; }
    public int? StockId { get; set; }
    public int? TreeStockId { get; set; }
    public List<HarvestAssessmentLine> Lines { get; set; } = [];
}

public class HarvestAssessmentLine
{
    public AssessmentGrade Grade { get; set; }
    public decimal Quantity { get; set; }
    public decimal Wasted { get; set; }
}
