namespace Server.Models;

/// <summary>
/// A growing area placed on a <see cref="GreenhouseFloor"/>'s canvas — a rectangle positioned and
/// sized within the greenhouse's Width/Length coordinate system. The unit of the positioning
/// editor: later assets placed inside one (shelves, sensors, irrigation lines) would reference a
/// section the same way a section references its floor.
/// </summary>
public class GreenhouseSection
{
    public int Id { get; set; }
    public int GreenhouseFloorId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Top-left corner, in the same units as the greenhouse's Width/Length.</summary>
    public decimal X { get; set; }
    public decimal Y { get; set; }

    public decimal Width { get; set; }
    public decimal Height { get; set; }

    /// <summary>Degrees, clockwise, around the section's own center. 0 = axis-aligned.</summary>
    public decimal Rotation { get; set; }
}
