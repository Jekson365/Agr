using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ISoilInvestigationRepository
{
    Task<IEnumerable<SoilInvestigation>> GetByPlotAsync(int landPlotId);

    Task<SoilInvestigationDetail?> GetDetailAsync(int id);

    Task<SoilInvestigationDetail> AddAsync(SoilInvestigation investigation, List<SoilInvestigationResult> results);

    Task<SoilInvestigationDetail?> UpdateAsync(SoilInvestigation investigation, List<SoilInvestigationResult> results);

    Task<SoilInvestigation?> DeleteAsync(int id);
}
