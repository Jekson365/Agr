using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>The outcome of trying to delete a fruit kind.</summary>
public enum DeleteFruitKindResult
{
    Deleted,
    NotFound,

    /// <summary>Tree stock rows still reference it, so removing it would orphan them.</summary>
    InUse,
}

public interface IFruitKindRepository
{
    Task<IEnumerable<FruitKind>> GetAllAsync();

    /// <summary>Whether a kind with this name (compared case-insensitively) already exists.</summary>
    Task<bool> ExistsByNameAsync(string name);

    /// <summary>Adds a new kind, or returns the existing one if a kind with that name (compared
    /// case-insensitively) already exists.</summary>
    Task<FruitKind> AddAsync(string name);

    Task<DeleteFruitKindResult> DeleteAsync(int id);
}
