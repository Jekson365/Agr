using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestSeedRepository
{
    Task<IEnumerable<HarvestSeed>> GetByHarvestAsync(int harvestId);

    /// <summary>Records seed sown for a harvest: deducts the amount from the seed and logs the
    /// matching <see cref="SeedMovement"/>.</summary>
    Task<HarvestSeed> AddAsync(HarvestSeed harvestSeed);

    /// <summary>Reworks an existing row — the previous amount is returned to its seed before the
    /// new one is deducted, so switching seed or amount leaves both balances correct.</summary>
    Task<bool> UpdateAsync(HarvestSeed harvestSeed);

    /// <summary>Removes the row and returns its amount to the seed.</summary>
    Task<bool> DeleteAsync(int id);
}
