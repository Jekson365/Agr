using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IAnimalProductionRepository
{
    Task<IEnumerable<AnimalProduction>> GetByAnimalAsync(int animalId);
    Task<IEnumerable<AnimalProduction>> GetByLivestockAsync(int livestockId);
    Task<AnimalProduction> AddAsync(AnimalProduction production);
    Task<bool> DeleteAsync(int id);
}
