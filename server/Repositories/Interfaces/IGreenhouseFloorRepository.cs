using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseFloorRepository
{
    Task<IEnumerable<GreenhouseFloor>> GetByGreenhouseAsync(int greenhouseId);
    Task<GreenhouseFloor?> GetByIdAsync(int id);
    Task<GreenhouseFloor> AddAsync(GreenhouseFloor floor);

    /// <summary>Renames a floor. Position/order isn't editable through this — floors are always
    /// appended and removed, never reordered, so there's nothing else on a floor to update.</summary>
    Task<bool> UpdateAsync(GreenhouseFloor floor);
    Task<bool> DeleteAsync(int id);
}

public interface IGreenhouseSectionRepository
{
    Task<IEnumerable<GreenhouseSection>> GetByFloorAsync(int greenhouseFloorId);
    Task<GreenhouseSection?> GetByIdAsync(int id);
    Task<GreenhouseSection> AddAsync(GreenhouseSection section);
    Task<bool> UpdateAsync(GreenhouseSection section);
    Task<bool> DeleteAsync(int id);
}

public interface IGreenhouseSectionStockRepository
{
    /// <summary>Every planting on every section belonging to this floor, in one call.</summary>
    Task<IEnumerable<GreenhouseSectionStock>> GetByFloorAsync(int greenhouseFloorId);

    /// <summary>Replaces the full set of stock kinds planted in a section with <paramref name="stockIds"/>.</summary>
    Task SetStockIdsAsync(int greenhouseSectionId, IEnumerable<int> stockIds);
}
