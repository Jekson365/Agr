using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILandPlotRepository
{
    Task<IEnumerable<LandPlot>> GetByFarmAsync(int farmId);
    Task<LandPlot?> GetByIdAsync(int id);
    Task<LandPlot> AddAsync(LandPlot plot);
    Task<bool> UpdateAsync(LandPlot plot);
    Task<bool> DeleteAsync(int id);
}
