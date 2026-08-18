namespace Server.Models;

/// <summary>A selectable livestock type — either one of the built-in defaults or a custom type a
/// user added. Referenced by <see cref="Livestock.Type"/> by name, not by id, so this catalog
/// only affects what shows up in pickers.</summary>
public class LivestockKind
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Artwork for a kind a user added, as the path <c>POST /api/{catalog}/upload-image</c>
    /// returned. Empty on the built-in kinds: those are drawn from the artwork bundled with each
    /// client, keyed by <see cref="Name"/>. A user-added kind has no bundled image to key to, so
    /// it carries its own and is shown with it everywhere the built-ins are shown with theirs.
    /// </summary>
    public string ImagePath { get; set; } = string.Empty;
}
