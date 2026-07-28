using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseHarvestRepository
{
    /// <summary>All greenhouse harvests, newest first, optionally for one greenhouse.</summary>
    Task<IEnumerable<GreenhouseHarvest>> GetAllAsync(int? greenhouseId = null);
    Task<GreenhouseHarvest?> GetByIdAsync(int id);
    Task<GreenhouseHarvest> AddAsync(GreenhouseHarvest harvest);
    Task<bool> UpdateAsync(GreenhouseHarvest harvest);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether any harvest still points at this greenhouse — checked before deleting one.</summary>
    Task<bool> ExistsForGreenhouseAsync(int greenhouseId);
}
