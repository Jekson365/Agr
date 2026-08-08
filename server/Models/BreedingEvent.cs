namespace Server.Models;

/// <summary>
/// One pairing of two animals and what came of it. Recorded from a livestock group's breeding
/// page, between two <see cref="LivestockDetail"/> animals — the individuals, not the groups,
/// because a group has no gender and a herd does not breed as a unit.
/// </summary>
public class BreedingEvent
{
    public int Id { get; set; }

    /// <summary>
    /// The group whose breeding page this was recorded from. Nullable, and only ever context:
    /// the pair may come from two different groups, and either group can be removed while the
    /// event stays worth keeping. What the event is actually about is the two animals below.
    /// </summary>
    public int? LivestockId { get; set; }

    /// <summary>The sire. Null once the animal itself is gone, which does not erase the event.</summary>
    public int? MaleAnimalId { get; set; }

    /// <summary>The dam, under the same rule as <see cref="MaleAnimalId"/>.</summary>
    public int? FemaleAnimalId { get; set; }

    /// <summary>When the pairing happened — given by the farmer, not stamped by the server, since
    /// it is routinely recorded after the fact. Doubles as the date of the
    /// <see cref="BreedingStatus.Breeding"/> stage.</summary>
    public DateOnly BreedingDate { get; set; }

    public string? Comment { get; set; }

    public BreedingStatus Status { get; set; } = BreedingStatus.Breeding;

    /// <summary>
    /// When the event reached <see cref="BreedingStatus.PregnancyConfirmed"/>. Stamped by the
    /// server the first time the status is moved there and left alone afterwards, so an event that
    /// went on to fail still says when the pregnancy had been confirmed.
    /// </summary>
    public DateOnly? PregnancyConfirmedDate { get; set; }

    /// <summary>When the event reached <see cref="BreedingStatus.Completed"/>.</summary>
    public DateOnly? CompletedDate { get; set; }

    /// <summary>When the event reached <see cref="BreedingStatus.Failed"/>.</summary>
    public DateOnly? FailedDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
