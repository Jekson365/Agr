namespace Server.Models;

/// <summary>A fruit tree stock entry the farm currently holds, e.g. 40 boxes of apples.</summary>
public class TreeStock
{
    public int Id { get; set; }

    /// <summary>The fruit kind's name (see <see cref="FruitKind"/>) — either a built-in default
    /// or a custom type a user added. Not a foreign key, so existing rows keep working even if
    /// the matching <see cref="FruitKind"/> is later renamed or removed.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional custom label, e.g. "Gala Apples", to tell apart stocks that share a Type.</summary>
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TreeStockUnit Unit { get; set; }

    /// <summary>The land plot these trees are planted on, if assigned yet.</summary>
    public int? LandPlotId { get; set; }
}
