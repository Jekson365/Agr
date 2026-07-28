using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IAnimalProductionRepository
{
    Task<IEnumerable<AnimalProduction>> GetAllAsync();
    Task<IEnumerable<AnimalProduction>> GetByAnimalAsync(int animalId);
    Task<IEnumerable<AnimalProduction>> GetByLivestockAsync(int livestockId);

    /// <summary>Whether any production is recorded against a group — either on the group itself
    /// or on one of its animals. Both are cascade-deleted with the group, so this guards against
    /// wiping history (and stranding the sales that were deducted from it).</summary>
    Task<bool> ExistsForLivestockAsync(int livestockId);

    /// <summary>Whether any production is recorded against a single animal.</summary>
    Task<bool> ExistsForAnimalAsync(int animalId);
    Task<AnimalProduction> AddAsync(AnimalProduction production);
    Task<bool> UpdateAsync(AnimalProduction production);
    Task<bool> DeleteAsync(int id);
}
