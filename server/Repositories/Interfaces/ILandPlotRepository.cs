using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILandPlotRepository
{
    Task<IEnumerable<LandPlot>> GetByFarmAsync(int farmId);
    Task<LandPlot?> GetByIdAsync(int id);

    /// <summary>
    /// Whether a plot of this farmland already grows this tree stock. Other land may grow it too —
    /// it's one plot per fruit within a piece of land. Pass the plot being edited as
    /// <paramref name="excludeId"/> so it doesn't clash with itself.
    /// </summary>
    Task<bool> ExistsByTreeStockAsync(int farmId, int treeStockId, int? excludeId = null);

    /// <summary>
    /// The tree stock entries plots have claimed, which the pickers leave out: those planted on
    /// <paramref name="farmId"/>, or — when it's null — those planted on any land at all.
    /// </summary>
    Task<IEnumerable<int>> GetUsedTreeStockIdsAsync(int? farmId = null);

    /// <summary>
    /// Removes every plot growing this tree stock, for when the stock itself is being deleted.
    /// Returns how many plots went with it.
    /// </summary>
    Task<int> DeleteByTreeStockAsync(int treeStockId);

    Task<LandPlot> AddAsync(LandPlot plot);
    Task<bool> UpdateAsync(LandPlot plot);
    Task<bool> DeleteAsync(int id);
}
