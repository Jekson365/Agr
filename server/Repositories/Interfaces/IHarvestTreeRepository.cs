using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestTreeRepository
{
    Task<IEnumerable<HarvestTree>> GetByHarvestAsync(int harvestId);
    Task<HarvestTree?> GetByIdAsync(int id);

    /// <summary>
    /// Whether this harvest already records those trees as picked. One row per orchard: how many
    /// of it were picked is one number, not several. Pass the row being edited as
    /// <paramref name="excludeId"/> so it doesn't clash with itself.
    /// </summary>
    Task<bool> ExistsForHarvestAsync(int harvestId, int treeStockId, int? excludeId = null);

    Task<HarvestTree> AddAsync(HarvestTree harvestTree);
    Task<bool> UpdateAsync(HarvestTree harvestTree);
    Task<bool> DeleteAsync(int id);

    /// <summary>Whether a harvest still records this orchard as picked — its rows cascade with
    /// the tree stock, so deleting one would rewrite what those harvests say.</summary>
    Task<bool> ExistsForTreeStockAsync(int treeStockId);

    /// <summary>The orchards some harvest records as picked, so a form can tell at a glance which
    /// ones have produce already on the books and settle their product.</summary>
    Task<IEnumerable<int>> GetPickedTreeStockIdsAsync();
}
