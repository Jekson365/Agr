namespace Server.Models;

public class SoilFertilityFactor
{
    public int Id { get; set; }
    public int RuleSetId { get; set; }
    public string Key { get; set; } = string.Empty;
    public int MinPoints { get; set; }
    public int MaxPoints { get; set; }
    public int SortOrder { get; set; }
    public int? ParameterId { get; set; }
    public SoilNutrientForm Form { get; set; } = SoilNutrientForm.None;
    public bool IsRequired { get; set; } = true;
}
