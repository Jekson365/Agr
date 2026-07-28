using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestTreeRepository
{
    Task<IEnumerable<HarvestTree>> GetByHarvestAsync(int harvestId);
    Task<HarvestTree> AddAsync(HarvestTree harvestTree);
    Task<bool> UpdateAsync(HarvestTree harvestTree);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether a harvest still records this orchard as picked — its rows cascade with
    /// the tree stock, so deleting one would rewrite what those harvests say.</summary>
    Task<bool> ExistsForTreeStockAsync(int treeStockId);
}
