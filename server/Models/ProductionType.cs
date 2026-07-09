namespace Server.Models;

/// <summary>A kind of output an animal can produce (e.g. Milk, Egg, Wool). Reference data.</summary>
public class ProductionType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
