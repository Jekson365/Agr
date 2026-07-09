using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IProductionTypeRepository
{
    Task<IEnumerable<ProductionType>> GetAllAsync();
}
