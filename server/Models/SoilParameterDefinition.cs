namespace Server.Models;

public class SoilParameterDefinition
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public SoilParameterGroup Group { get; set; }
    public SoilParameterValueKind ValueKind { get; set; }
    public string DefaultUnit { get; set; } = string.Empty;
    public string DefaultUnitAvailable { get; set; } = string.Empty;
    public bool SupportsForms { get; set; }
    public int SortOrder { get; set; }
    public bool IsRegulationParameter { get; set; } = true;
}
