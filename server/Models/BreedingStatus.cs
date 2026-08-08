namespace Server.Models;

/// <summary>
/// How far a <see cref="BreedingEvent"/> has got. It starts at <see cref="Breeding"/> when the
/// pairing is recorded and ends at either <see cref="Completed"/> or <see cref="Failed"/>; each
/// stage stamps its own date on the event as it is reached, so the event carries when it got
/// there rather than only where it is now.
/// </summary>
public enum BreedingStatus
{
    Breeding,
    PregnancyConfirmed,
    Completed,
    Failed,
}
