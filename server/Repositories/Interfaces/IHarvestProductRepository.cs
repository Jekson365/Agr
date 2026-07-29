using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestProductRepository
{
    /// <summary>Amounts recorded for one harvest, or every harvest's when omitted (the Products
    /// page totals them per product).</summary>
    Task<IEnumerable<HarvestProduct>> GetAsync(int? harvestId = null);

    /// <summary>Whether any harvest recorded produce against this product — those rows would be
    /// blocked by the Restrict FK, so the controller checks first and reports a clean conflict.</summary>
    Task<bool> ExistsForProductAsync(int treeProductId);

    Task<HarvestProduct> AddAsync(HarvestProduct harvestProduct);
    Task<bool> UpdateAsync(HarvestProduct harvestProduct);
    Task<bool> DeleteAsync(int id);

    /// <summary>Brings every produce row of a harvest in line with its status: the movements that
    /// put the fruit on its product's balance exist only while the harvest is Harvested. Call it
    /// after the status changes, so moving back off Harvested takes the produce away again.</summary>
    Task SyncMovementsForHarvestAsync(int harvestId);
}
