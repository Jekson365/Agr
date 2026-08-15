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

    /// <summary>The one <see cref="TreeProduct"/> these trees yield, chosen from the catalog when
    /// the row is added and required from then on — no two stocks may name the same product, which
    /// the table enforces with a unique index. Nullable only for fruit recorded before a product
    /// was asked for; those rows keep producing nothing until one is assigned.</summary>
    public int? TreeProductId { get; set; }

    /// <summary>
    /// Whether this fruit has been removed from the Fruit page. Marked rather than dropped: its
    /// movement log, the harvest rows recording these trees as picked, and its land plot all point
    /// at it, and removing it would take that history with them (see the cascades in
    /// <see cref="Server.Data.AppDbContext"/>). A deleted fruit is left out of the fruit list and
    /// of the plan's count, and no longer takes edits or sales.
    /// </summary>
    public bool IsDeleted { get; set; }
}
