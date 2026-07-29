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

    /// <summary>
    /// The <see cref="TreeStock"/> row growing here, picked from the fruits the farm holds. One
    /// plot per fruit within a piece of land, though other land may grow the same fruit. Null on
    /// plots recorded before a plot named its fruit, and on ones whose stock was deleted since.
    /// </summary>
    public int? TreeStockId { get; set; }
}
