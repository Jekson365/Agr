namespace Server.Models;

/// <summary>
/// A portion of a <see cref="Farm"/> dedicated to one crop — e.g. "30 ha of potatoes" within a
/// larger farmland. What grows there is either a fruit the farm holds
/// (<see cref="TreeStockId"/>) or one of its stock goods (<see cref="StockId"/>), never both.
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

    /// <summary>
    /// The <see cref="Stock"/> row growing here, for plots of a field crop rather than fruit
    /// trees. Follows the same one-per-piece-of-land rule as <see cref="TreeStockId"/>, and is
    /// null whenever the plot names a fruit instead (or named neither, on older rows).
    /// </summary>
    public int? StockId { get; set; }
}
