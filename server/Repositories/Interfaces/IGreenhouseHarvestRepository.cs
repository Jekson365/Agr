using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseHarvestRepository
{
    /// <summary>All greenhouse harvests, newest first, optionally for one greenhouse.</summary>
    Task<IEnumerable<GreenhouseHarvest>> GetAllAsync(int? greenhouseId = null);

    /// <summary>
    /// One greenhouse's harvests with the yield each recorded, newest first and capped at
    /// <paramref name="limit"/> — the greenhouse page's list, read in a single call. The filters
    /// are applied before the cap, so narrowing to a status or a date window searches the whole
    /// history rather than the page already on screen.
    /// </summary>
    Task<IEnumerable<GreenhouseHarvestSummary>> GetSummariesAsync(
        int greenhouseId,
        HarvestStatus? status,
        DateOnly? from,
        DateOnly? to,
        int limit);
    Task<GreenhouseHarvest?> GetByIdAsync(int id);
    Task<GreenhouseHarvest> AddAsync(GreenhouseHarvest harvest);
    Task<bool> UpdateAsync(GreenhouseHarvest harvest);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether any harvest still points at this greenhouse — checked before deleting one.</summary>
    Task<bool> ExistsForGreenhouseAsync(int greenhouseId);
}
