using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>The outcome of trying to delete a livestock kind.</summary>
public enum DeleteLivestockKindResult
{
    Deleted,
    NotFound,

    /// <summary>Livestock groups still reference it, so removing it would orphan them.</summary>
    InUse,

    /// <summary>One of the kinds every farm is seeded with. Those are the catalog's floor — only
    /// kinds a user added may be taken back out.</summary>
    BuiltIn,
}

public interface ILivestockKindRepository
{
    Task<IEnumerable<LivestockKind>> GetAllAsync();

    /// <summary>Whether a kind with this name (compared case-insensitively) already exists.</summary>
    Task<bool> ExistsByNameAsync(string name);

    /// <summary>Adds a kind, or returns the existing one if a kind with that name (compared
    /// case-insensitively) already exists.</summary>
    Task<LivestockKind> AddAsync(string name);

    Task<DeleteLivestockKindResult> DeleteAsync(int id);
}
