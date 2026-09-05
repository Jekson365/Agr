namespace Server.Models;

public class OrchardBlock
{
    public int Id { get; set; }

    public int TreeStockId { get; set; }

    /// <summary>The planted area's outline as a JSON string of [[lat,lng],…], the same shape
    /// <see cref="Farm.Boundary"/> keeps. Text rather than a geometry column: nothing queries it
    /// spatially, and the client draws it.</summary>
    public string Boundary { get; set; } = string.Empty;

    public PlantingPattern Pattern { get; set; } = PlantingPattern.Square;

    /// <summary>Metres between trees along a row.</summary>
    public decimal TreeSpacing { get; set; }

    /// <summary>Metres between rows. Ignored for <see cref="PlantingPattern.Triangular"/>, which
    /// derives it from the tree spacing so every tree sits equidistant from six neighbours.</summary>
    public decimal RowSpacing { get; set; }

    /// <summary>Which way the rows run, in degrees clockwise from east–west.</summary>
    public double Rotation { get; set; }

    /// <summary>How many trees the plan comes to — the whole outline filled at these spacings.
    /// Worked out by the client from the outline and the spacings and stored alongside them, so a
    /// list can report it without redoing the geometry.</summary>
    public int TreeCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
