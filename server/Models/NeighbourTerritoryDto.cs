namespace Server.Models;

/// <summary>
/// Someone else's territory as the map needs it: whose land it is, what they call it, and its
/// outline. Deliberately thin — a map may draw dozens of these, and what a farmer grows or what
/// they look like is only worth fetching for the one a user actually asks about. See
/// <see cref="TerritoryDetailsDto"/> for that.
/// </summary>
public class NeighbourTerritoryDto
{
    /// <summary>The other user's id — with <see cref="FarmId"/>, what a details request is
    /// addressed to.</summary>
    public int UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;

    /// <summary>Whether this is an accepted neighbour, as opposed to any other farmer — the map
    /// draws the two differently.</summary>
    public bool IsNeighbour { get; set; }

    /// <summary>Kilometres from the caller's nearest field to this one, where both can be placed.</summary>
    public double? DistanceKm { get; set; }

    /// <summary>Id of the land within the owner's own data — a key for the map, not something the
    /// caller can address any other endpoint with.</summary>
    public int FarmId { get; set; }

    public string FarmName { get; set; } = string.Empty;

    /// <summary>The outline, in the same JSON form as <see cref="Farm.Boundary"/>.</summary>
    public string Boundary { get; set; } = string.Empty;

    public decimal Area { get; set; }
}

/// <summary>
/// One territory in full, fetched when someone picks it out on the map: who farms it, and what
/// they have growing there.
/// </summary>
public class TerritoryDetailsDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;

    // Enough of the owner's public profile to introduce them beside their land. Their phone number
    // is deliberately not here: being visible on a map is not an invitation to call.
    public string ImagePath { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    public bool IsNeighbour { get; set; }
    public double? DistanceKm { get; set; }

    public int FarmId { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public decimal Area { get; set; }

    /// <summary>What is being grown here — one entry per plot the owner has recorded.</summary>
    public List<TerritoryCropDto> Crops { get; set; } = [];
}

/// <summary>One crop growing on a piece of land, as its owner recorded it.</summary>
public class TerritoryCropDto
{
    /// <summary>The catalogue kind the plot names — "Tomato", "Apple" — which the client
    /// translates, or shows as typed when it is one the grower added themselves.</summary>
    public string Crop { get; set; } = string.Empty;

    /// <summary>What the grower calls the particular fruit planted here — "Gala" rather than
    /// "Apple". Empty on plots that never named one.</summary>
    public string Name { get; set; } = string.Empty;

    public decimal Area { get; set; }
}
