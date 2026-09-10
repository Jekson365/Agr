using Server.Models;

namespace Server.Services.Interfaces;

public interface ISoilFertilityScoringService
{
    Task<SoilFertilityAssessmentDetail?> EvaluateAsync(int investigationId);

    Task<SoilFertilityAssessmentDetail?> CalculateAsync(int investigationId);

    Task<SoilFertilityAssessmentDetail?> GetAsync(int investigationId);

    Task<SoilReferenceData> GetReferenceDataAsync();

    Task<List<SoilFertilityAssessment>> HistoryAsync(int landPlotId);
}
