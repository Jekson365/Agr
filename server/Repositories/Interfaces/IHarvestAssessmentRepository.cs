using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestAssessmentRepository
{
    /// <summary>Every filter is optional: a harvest's whole sheet, one good's bands across all
    /// of them, or the lot.</summary>
    Task<IEnumerable<HarvestAssessment>> GetAsync(int? harvestId, int? stockId, int? treeStockId);

    /// <summary>Replaces every line the good already had in this harvest with the ones given,
    /// and returns what the sheet now holds.</summary>
    Task<IEnumerable<HarvestAssessment>> SaveSheetAsync(HarvestAssessmentSheet sheet);
}
