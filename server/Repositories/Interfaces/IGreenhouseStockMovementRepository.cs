using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseStockMovementRepository
{
    Task<IEnumerable<GreenhouseStockMovement>> GetAsync(int? greenhouseStockId = null);
    Task<GreenhouseStockMovement> AddAsync(GreenhouseStockMovement movement);
}
