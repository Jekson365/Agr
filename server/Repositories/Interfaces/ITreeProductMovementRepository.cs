using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ITreeProductMovementRepository
{
    /// <summary>Movements for one product, or every product's when omitted (the Products page
    /// sums them per product for the balance), each dated by the harvest behind it where there
    /// is one — see <see cref="TreeProductMovementDto"/>.</summary>
    Task<IEnumerable<TreeProductMovementDto>> GetAsync(int? treeProductId = null);

    /// <summary>What's currently on hand for a product: the sum of its movements.</summary>
    Task<decimal> GetBalanceAsync(int treeProductId);

    Task<TreeProductMovement> AddAsync(TreeProductMovement movement);

    Task<bool> DeleteAsync(int id);

    /// <summary>Updates the movement linked to <paramref name="harvestProductId"/> in place
    /// rather than logging a new one. Returns false when none is linked yet.</summary>
    Task<bool> UpdateForHarvestProductAsync(int harvestProductId, decimal delta);

    /// <summary>Removes the movement linked to <paramref name="harvestProductId"/>, if any.</summary>
    Task<bool> DeleteForHarvestProductAsync(int harvestProductId);
}
