namespace Server.Models;

public enum TreeProductMovementSource
{
    Manual,

    /// <summary>Produce recorded on a fruit harvest (see <see cref="HarvestProduct"/>).</summary>
    Harvest,

    /// <summary>Produce sold — a negative movement drawing the balance down.</summary>
    Market,
}

/// <summary>A single change to a <see cref="TreeProduct"/>'s balance, tagged with what caused it
/// — the fruit-product counterpart of <see cref="SeedMovement"/>. A harvest's recorded produce
/// adds one; manual entries adjust or draw the balance down.</summary>
public class TreeProductMovement
{
    public int Id { get; set; }
    public int TreeProductId { get; set; }

    /// <summary>
    /// The harvest's produce row this movement represents, when <see cref="Source"/> is
    /// <see cref="TreeProductMovementSource.Harvest"/>. Editing that row updates this same
    /// movement instead of logging a new one, so history can't drift from the balance.
    /// </summary>
    public int? HarvestProductId { get; set; }

    /// <summary>Signed change to the balance — positive when harvested, negative when drawn down.</summary>
    public decimal Delta { get; set; }
    public TreeProductMovementSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
