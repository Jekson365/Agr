using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ISeedRepository
{
    /// <summary>
    /// The seed the farm holds. Deleted seed is left out unless <paramref name="includeDeleted"/>
    /// asks for it, which the pages naming seed a harvest already records as sown need.
    /// </summary>
    Task<IEnumerable<Seed>> GetAllAsync(bool includeDeleted = false);

    /// <summary>Any seed, deleted or not — a harvest names the one it sowed by id.</summary>
    Task<Seed?> GetByIdAsync(int id);

    /// <summary>
    /// Records seed the farm now holds. Only ever called for the seed created alongside the stock
    /// of the same crop (<c>POST /api/stocks/with-seed</c>) — a seed is not kept by hand, so there
    /// is no editing or deleting counterpart to this; see <see cref="Server.Controllers.SeedsController"/>.
    /// </summary>
    Task<Seed> AddAsync(Seed seed);

    /// <summary>
    /// Marks the seed of this crop deleted — the seed a stock was created with shares its type and
    /// name (see <c>POST /api/stocks/with-seed</c>), which is the only thing tying the two together.
    /// Both are compared trimmed and case-insensitively. Returns how many seeds were marked.
    /// </summary>
    Task<int> SoftDeleteByCropAsync(string type, string name);

    /// <summary>
    /// Adds <paramref name="delta"/> to a seed's amount without logging a movement — the caller
    /// owns the history entry (see <see cref="Server.Repositories.HarvestSeedRepository"/>, which
    /// keeps one movement per harvest row and edits it in place). A no-op if the seed is gone.
    /// </summary>
    Task AdjustAmountRawAsync(int seedId, decimal delta);
}
