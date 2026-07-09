using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IFruitKindRepository
{
    Task<IEnumerable<FruitKind>> GetAllAsync();

    /// <summary>Adds a new kind, or returns the existing one if a kind with that name (compared
    /// case-insensitively) already exists.</summary>
    Task<FruitKind> AddAsync(string name);
}
