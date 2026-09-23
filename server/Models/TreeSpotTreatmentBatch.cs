namespace Server.Models;

/// <summary>
/// One application recorded against several trees at once — what the positioning panel posts when
/// a selection is given a date, a type and a note. The server fans it out to a row per tree.
/// </summary>
public class TreeSpotTreatmentBatch
{
    public int TreeStockId { get; set; }

    public DateOnly Date { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;

    public List<TreeSpotTarget> Trees { get; set; } = [];
}
