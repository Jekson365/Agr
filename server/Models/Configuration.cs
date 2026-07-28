namespace Server.Models;

/// <summary>
/// A per-tenant switch, stored as a name/value pair so new ones are a seeded row rather than a
/// schema change. <c>greenhouse</c> is the first: 0 hides the greenhouse area, anything else shows
/// it. Every configuration is listed on the user's profile.
/// </summary>
public class Configuration
{
    public int Id { get; set; }

    /// <summary>The setting's key, unique within a tenant (e.g. `greenhouse`).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Its current value. Today every setting is a 0/1 flag.</summary>
    public int Value { get; set; }
}
