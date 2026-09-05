using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestChemicalRepository
{
    Task<IEnumerable<HarvestChemical>> GetAsync(int? harvestId = null);
    Task<HarvestChemical> AddAsync(HarvestChemical harvestChemical);
    Task<bool> UpdateAsync(HarvestChemical harvestChemical);
    Task<bool> DeleteAsync(int id);
}
