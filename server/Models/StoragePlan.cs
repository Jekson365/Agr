namespace Server.Models;

/// <summary>A user's image-upload storage tier.</summary>
public enum StoragePlan
{
    Free,
    Medium,
    Premium,
}

public static class StoragePlanLimits
{
    public const long FreeBytes = 50L * 1024 * 1024;
    public const long MediumBytes = 300L * 1024 * 1024;

    /// <summary>The plan's byte quota, or null when it has no cap (<see cref="StoragePlan.Premium"/>).</summary>
    public static long? BytesFor(StoragePlan plan) => plan switch
    {
        StoragePlan.Free => FreeBytes,
        StoragePlan.Medium => MediumBytes,
        StoragePlan.Premium => null,
        _ => throw new ArgumentOutOfRangeException(nameof(plan)),
    };
}
