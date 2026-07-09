namespace Server.Models;

/// <summary>A selectable stock type — either one of the built-in defaults or a custom type a
/// user added. Referenced by <see cref="Stock.Type"/> (and <see cref="LandPlot.Crop"/>) by name,
/// not by id, so this catalog only affects what shows up in pickers.</summary>
public class StockKind
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
