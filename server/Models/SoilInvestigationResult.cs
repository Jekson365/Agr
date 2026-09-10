namespace Server.Models;

public class SoilInvestigationResult
{
    public int Id { get; set; }
    public int SoilInvestigationId { get; set; }
    public int ParameterId { get; set; }
    public SoilNutrientForm Form { get; set; } = SoilNutrientForm.None;
    public decimal? NumericValue { get; set; }
    public string TextValue { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string Unit { get; set; } = string.Empty;
}
