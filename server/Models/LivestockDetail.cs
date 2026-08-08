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

    /// <summary>
    /// The animals this one came from, when it was recorded as the result of a
    /// <see cref="BreedingEvent"/> rather than entered on its own.
    ///
    /// Both nullable and both nulled rather than cascaded if a parent is removed: an animal does
    /// not stop existing because its dam did. Which of the two is the sire is not fixed — they are
    /// simply the pair the breeding event named.
    /// </summary>
    public int? ParentOneId { get; set; }

    /// <summary>The other parent — see <see cref="ParentOneId"/>.</summary>
    public int? ParentTwoId { get; set; }
}
