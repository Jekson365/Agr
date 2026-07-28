using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestChemicalRepository
{
    Task<IEnumerable<HarvestChemical>> GetByHarvestAsync(int harvestId);
    Task<HarvestChemical> AddAsync(HarvestChemical harvestChemical);
    Task<bool> UpdateAsync(HarvestChemical harvestChemical);
    Task<bool> DeleteAsync(int id);
}
