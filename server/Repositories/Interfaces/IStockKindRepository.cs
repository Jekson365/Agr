using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IStockKindRepository
{
    Task<IEnumerable<StockKind>> GetAllAsync();

    /// <summary>Adds a new kind, or returns the existing one if a kind with that name (compared
    /// case-insensitively) already exists.</summary>
    Task<StockKind> AddAsync(string name);
}
