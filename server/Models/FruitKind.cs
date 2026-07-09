namespace Server.Models;

/// <summary>A selectable fruit type — either one of the built-in defaults or a custom type a
/// user added. Referenced by <see cref="TreeStock.Type"/> by name, not by id, so this catalog
/// only affects what shows up in pickers.</summary>
public class FruitKind
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
