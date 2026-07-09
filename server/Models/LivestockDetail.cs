namespace Server.Models;

/// <summary>
/// An individual animal within a <see cref="Livestock"/> group — identified by a code
/// (e.g. an ear-tag number) and an optional photo.
/// </summary>
public class LivestockDetail
{
    public int Id { get; set; }
    public int LivestockId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;

    /// <summary>The animal's date of birth, if known. Used to display its age.</summary>
    public DateOnly? BornDate { get; set; }

    /// <summary>The animal's gender, if known.</summary>
    public Gender? Gender { get; set; }
}
