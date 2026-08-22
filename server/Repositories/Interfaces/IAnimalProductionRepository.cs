using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IAnimalProductionRepository
{
    Task<IEnumerable<AnimalProduction>> GetAllAsync();
    Task<IEnumerable<AnimalProduction>> GetByAnimalAsync(int animalId);
    Task<IEnumerable<AnimalProduction>> GetByLivestockAsync(int livestockId);
    Task<AnimalProduction?> GetByIdAsync(int id);

    /// <summary>Whether any production is recorded against a group — either on the group itself
    /// or on one of its animals. Both are cascade-deleted with the group, so this guards against
    /// wiping history (and stranding the sales that were deducted from it).</summary>
    Task<bool> ExistsForLivestockAsync(int livestockId);

    /// <summary>Whether a group has collected anything under one particular production type —
    /// asked before that type is taken off what the group declares, since the records already
    /// counted under it would be left naming an output the group no longer claims.</summary>
    Task<bool> ExistsForLivestockAndTypeAsync(int livestockId, int productionTypeId);

    /// <summary>Whether any production is recorded against a single animal.</summary>
    Task<bool> ExistsForAnimalAsync(int animalId);

    /// <summary>Whether this animal has been realized — it carries a realization record. The
    /// record is the mark: the animal is realized for as long as it is there, and is not once it
    /// is removed.</summary>
    Task<bool> ExistsRealizationForAnimalAsync(int animalId);
    Task<AnimalProduction> AddAsync(AnimalProduction production);
    Task<bool> UpdateAsync(AnimalProduction production);
    Task<bool> DeleteAsync(int id);
}
