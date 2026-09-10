namespace Server.Models;

public class SoilParameterCategory
{
    public int Id { get; set; }
    public int ParameterId { get; set; }
    public string Key { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
