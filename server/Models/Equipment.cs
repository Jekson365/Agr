namespace Server.Models;

/// <summary>A piece of farm equipment the user owns, e.g. 3 tractors, with an optional photo.</summary>
public class Equipment
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}
