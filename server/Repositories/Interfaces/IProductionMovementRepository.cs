using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IProductionMovementRepository
{
    Task<IEnumerable<ProductionMovement>> GetAllAsync();

    /// <summary>What's currently left of a production type in one unit: everything collected
    /// plus the movements already logged against it (sales carry a negative delta).</summary>
    Task<decimal> GetBalanceAsync(int productionTypeId, int unitId);

    Task<ProductionMovement> AddAsync(ProductionMovement movement);

    /// <summary>Removes a movement, returning its quantity to the balance, and hands back the
    /// row that was removed so the caller can undo what else the sale changed. Null when no
    /// movement has that id.</summary>
    Task<ProductionMovement?> DeleteAsync(int id);
}
