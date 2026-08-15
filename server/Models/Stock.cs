namespace Server.Models;

/// <summary>A good the farm currently holds, e.g. 120 kg of beans.</summary>
public class Stock
{
    public int Id { get; set; }

    /// <summary>The stock kind's name (see <see cref="StockKind"/>) — either a built-in default
    /// or a custom type a user added. Not a foreign key, so existing rows keep working even if
    /// the matching <see cref="StockKind"/> is later renamed or removed.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Optional custom label, e.g. "Dutch Cucumber", to tell apart stocks that share a Type.</summary>
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public StockUnit Unit { get; set; }

    /// <summary>
    /// Set when the stock is removed from the stock page. The row stays — harvest plans, results,
    /// movements and photos all point at it, and removing it would take that history with them
    /// (see the cascades in <see cref="Server.Data.AppDbContext"/>). A deleted stock is left out
    /// of the stock list and of everywhere a good is picked, and no longer takes edits or sales.
    /// </summary>
    public bool IsDeleted { get; set; }
}
