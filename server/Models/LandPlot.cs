namespace Server.Models;

/// <summary>
/// A portion of a <see cref="Farm"/> dedicated to one crop — e.g. "30 ha of potatoes" within a
/// larger farmland.
/// </summary>
public class LandPlot
{
    public int Id { get; set; }
    public int FarmId { get; set; }
    public decimal Area { get; set; }
    public string Crop { get; set; } = string.Empty;
}
