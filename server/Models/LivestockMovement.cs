namespace Server.Models;

/// <summary>Where a change in a group's head count came from.</summary>
public enum LivestockMovementSource
{
    /// <summary>Entered by hand — the count a group was created with, or a correction since.</summary>
    Manual,

    /// <summary>Born on the farm: recorded as the result of a <see cref="BreedingEvent"/>.</summary>
    Birth,

    /// <summary>Given to the farm.</summary>
    Gift,

    /// <summary>Bought in.</summary>
    Purchase,

    /// <summary>Slaughtered. Kept for the entries written while a realization took its animals
    /// off the group; it no longer does — it marks the group instead (see
    /// <see cref="Livestock.IsRealized"/>) — so nothing writes this any more and the rows that
    /// carry it are history.</summary>
    Realization,
}

/// <summary>
/// One change to a <see cref="Livestock"/> group's head count, tagged with what caused it.
///
/// The count itself is a single number, which says nothing about how a herd got to it. These rows
/// are the account of that: forty birds bought in, four born, three realized. Written by the
/// things that move the count rather than kept in step by hand, so the ledger and the count cannot
/// tell different stories.
/// </summary>
public class LivestockMovement
{
    public int Id { get; set; }
    public int LivestockId { get; set; }

    /// <summary>How many head this added, or removed when negative.</summary>
    public int Delta { get; set; }

    public LivestockMovementSource Source { get; set; }

    /// <summary>The day it happened, which is not always the day it was recorded.</summary>
    public DateOnly Date { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
