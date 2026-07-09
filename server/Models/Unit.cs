namespace Server.Models;

/// <summary>A unit of measure for recording production quantities (e.g. Kilogram/kg). Reference data.</summary>
public class Unit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
}
