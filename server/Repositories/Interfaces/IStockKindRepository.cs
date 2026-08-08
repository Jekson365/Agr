using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>The outcome of trying to delete a stock kind.</summary>
public enum DeleteStockKindResult
{
    Deleted,
    NotFound,

    /// <summary>Stock or seed rows still reference it, so removing it would orphan them.</summary>
    InUse,

    /// <summary>One of the kinds every farm is seeded with. Those are the catalog's floor — only
    /// kinds a user added may be taken back out.</summary>
    BuiltIn,
}

public interface IStockKindRepository
{
    Task<IEnumerable<StockKind>> GetAllAsync();

    /// <summary>Whether a kind with this name (compared case-insensitively) already exists.</summary>
    Task<bool> ExistsByNameAsync(string name);

    /// <summary>Adds a new kind, or returns the existing one if a kind with that name (compared
    /// case-insensitively) already exists.</summary>
    Task<StockKind> AddAsync(string name);

    Task<DeleteStockKindResult> DeleteAsync(int id);
}
