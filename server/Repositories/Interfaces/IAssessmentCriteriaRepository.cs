using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IAssessmentCriteriaRepository
{
    Task<IEnumerable<AssessmentCriteria>> GetAsync(int? stockId, int? treeStockId);

    /// <summary>Replaces the bands the good already had with the ones given, and returns what its
    /// standard now holds.</summary>
    Task<IEnumerable<AssessmentCriteria>> SaveSheetAsync(AssessmentCriteriaSheet sheet);
}
