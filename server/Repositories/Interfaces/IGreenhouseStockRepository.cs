using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseStockRepository
{
    /// <summary>All greenhouse stock, or just one greenhouse's.</summary>
    Task<IEnumerable<GreenhouseStock>> GetAllAsync(int? greenhouseId = null);
    Task<GreenhouseStock?> GetByIdAsync(int id);
    Task<GreenhouseStock> AddAsync(GreenhouseStock stock);
    Task<bool> UpdateAsync(GreenhouseStock stock);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether any stock still sits in this greenhouse — checked before deleting one.</summary>
    Task<bool> ExistsForGreenhouseAsync(int greenhouseId);

    /// <summary>
    /// Whether another row already carries this label, in any greenhouse. Case-insensitive, since
    /// two spellings of one name read as the same label. Pass the row being edited as
    /// <paramref name="excludeId"/> so it doesn't clash with itself.
    /// </summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);

    /// <summary>
    /// Adds <paramref name="delta"/> to the amount of the stock row identified by
    /// <paramref name="stockId"/> (a no-op if it no longer exists). Used by greenhouse harvest
    /// results to apply/reverse yield — see <see cref="GreenhouseHarvestResult"/>.
    /// </summary>
    Task AdjustAmountRawAsync(int stockId, decimal delta);
}

public interface IGreenhouseSeedRepository
{
    /// <summary>All greenhouse seed, or just one greenhouse's.</summary>
    Task<IEnumerable<GreenhouseSeed>> GetAllAsync(int? greenhouseId = null);
    Task<GreenhouseSeed?> GetByIdAsync(int id);
    Task<GreenhouseSeed> AddAsync(GreenhouseSeed seed);
    Task<bool> UpdateAsync(GreenhouseSeed seed);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether any seed is still held for this greenhouse.</summary>
    Task<bool> ExistsForGreenhouseAsync(int greenhouseId);

    /// <summary>
    /// Adds <paramref name="delta"/> to the amount of the seed row identified by
    /// <paramref name="seedId"/> (a no-op if it no longer exists). Used to deduct seed sown for a
    /// harvest and to give it back — see <see cref="GreenhouseHarvestSeed"/>.
    /// </summary>
    Task AdjustAmountRawAsync(int seedId, decimal delta);
}
