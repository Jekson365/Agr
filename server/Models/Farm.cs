namespace Server.Models;

public class Farm
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// The territory the owner marked on the map, as a JSON array of <c>[latitude, longitude]</c>
    /// pairs in order around the outline — <c>[[41.71,44.82],[41.72,44.83],…]</c>. Kept as text
    /// rather than a geometry column: nothing queries it spatially, it is only drawn back on a map.
    /// Null means the client said nothing about the territory (an older client that doesn't know
    /// the field); an empty array is a territory the owner deliberately cleared.
    /// </summary>
    public string? Boundary { get; set; }
}
