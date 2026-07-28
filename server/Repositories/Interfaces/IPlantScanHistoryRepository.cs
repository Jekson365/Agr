using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IPlantScanHistoryRepository
{
    Task<IEnumerable<PlantScanHistory>> GetAllAsync();
    Task<PlantScanHistory> AddAsync(PlantScanHistory history);

    /// <summary>Deletes the entry and returns it (for cleanup of its saved image), or null if not found.</summary>
    Task<PlantScanHistory?> DeleteAsync(int id);
}
