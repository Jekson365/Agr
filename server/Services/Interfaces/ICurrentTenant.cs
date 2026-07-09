namespace Server.Services.Interfaces;

/// <summary>Exposes the user resolved from the current request's JWT. Each user is their own tenant.</summary>
public interface ICurrentTenant
{
    /// <summary>User id from the token, or 0 when unauthenticated.</summary>
    int UserId { get; }

    /// <summary>Display name from the token, or null when unauthenticated.</summary>
    string? Name { get; }
}
