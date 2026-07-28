namespace Server.Models;

/// <summary>
/// A greenhouse the user runs — covered growing space, recorded much like a <see cref="Farm"/>.
/// Only visible while the <c>greenhouse</c> <see cref="Configuration"/> is switched on.
/// </summary>
public class Greenhouse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Uploaded photo; empty falls back to the greenhouse icon on the client.</summary>
    public string ImagePath { get; set; } = string.Empty;
    public decimal Area { get; set; }

    /// <summary>When it was built. Optional — one can be recorded before the date is known.</summary>
    public DateOnly? EstablishDate { get; set; }
    public string Location { get; set; } = string.Empty;

    // The physical size of the structure — set up once in the positioning editor, then used as
    // the coordinate system every floor's sections are placed and bounded within. 0 means "not
    // configured yet" (the default for a greenhouse created before positioning existed, or one
    // whose layout hasn't been set up), and boundary checks are skipped while any dimension is 0.
    public decimal Width { get; set; }
    public decimal Length { get; set; }
    public decimal Height { get; set; }
}
