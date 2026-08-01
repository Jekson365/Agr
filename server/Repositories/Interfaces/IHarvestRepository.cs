using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestRepository
{
    /// <summary>Every harvest, or just those of one kind when <paramref name="kind"/> is given.</summary>
    Task<IEnumerable<Harvest>> GetAllAsync(HarvestKind? kind = null);
    Task<Harvest?> GetByIdAsync(int id);
    Task<Harvest> AddAsync(Harvest harvest);
    Task<bool> UpdateAsync(Harvest harvest);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Whether any harvest records this plant stock — planned as a <see cref="HarvestItem"/> or
    /// picked as a <see cref="HarvestResult"/>. Either way the harvest is written in that good's
    /// terms, so what the good is and how it is measured are settled from then on.
    /// </summary>
    Task<bool> RecordsStockAsync(int stockId);

    /// <summary>The plant stocks some harvest records, by the same rule — what a form needs to know
    /// which rows have their kind and unit settled.</summary>
    Task<IEnumerable<int>> GetRecordedStockIdsAsync();
}
