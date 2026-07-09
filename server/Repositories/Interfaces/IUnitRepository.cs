using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IUnitRepository
{
    Task<IEnumerable<Unit>> GetAllAsync();
}
