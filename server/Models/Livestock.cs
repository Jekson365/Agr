namespace Server.Models;

public class Livestock
{
    public int Id { get; set; }

    /// <summary>A <see cref="LivestockKind"/> name — an open set of built-in defaults plus
    /// whatever custom kinds the user added, referenced by name like Stock.Type.</summary>
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FarmId { get; set; }
}
