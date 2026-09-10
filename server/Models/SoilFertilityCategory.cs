namespace Server.Models;

public class SoilFertilityCategory
{
    public int Id { get; set; }
    public int RuleSetId { get; set; }
    public string Key { get; set; } = string.Empty;
    public int MinScore { get; set; }
    public int MaxScore { get; set; }
    public int SortOrder { get; set; }
}
