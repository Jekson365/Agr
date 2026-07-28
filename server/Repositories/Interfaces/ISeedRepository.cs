using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ISeedRepository
{
    Task<IEnumerable<Seed>> GetAllAsync();
    Task<Seed?> GetByIdAsync(int id);
    Task<Seed> AddAsync(Seed seed);
    Task<bool> UpdateAsync(Seed seed);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Adds <paramref name="delta"/> to a seed's amount without logging a movement — the caller
    /// owns the history entry (see <see cref="Server.Repositories.HarvestSeedRepository"/>, which
    /// keeps one movement per harvest row and edits it in place). A no-op if the seed is gone.
    /// </summary>
    Task AdjustAmountRawAsync(int seedId, decimal delta);
}
