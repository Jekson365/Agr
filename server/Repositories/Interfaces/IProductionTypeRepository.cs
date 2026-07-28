using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>The outcome of trying to delete a production type.</summary>
public enum DeleteProductionTypeResult
{
    Deleted,
    NotFound,

    /// <summary>Production records still reference it, so removing it would orphan them.</summary>
    InUse,
}

public interface IProductionTypeRepository
{
    Task<IEnumerable<ProductionType>> GetAllAsync();

    /// <summary>Whether a type with this name (compared case-insensitively) already exists.</summary>
    Task<bool> ExistsByNameAsync(string name);

    /// <summary>Adds a type, or returns the existing one when that name is already present.</summary>
    Task<ProductionType> AddAsync(string name);

    Task<DeleteProductionTypeResult> DeleteAsync(int id);
}
