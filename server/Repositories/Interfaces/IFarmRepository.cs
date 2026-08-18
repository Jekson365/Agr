using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IFarmRepository
{
    Task<IEnumerable<Farm>> GetAllAsync();
    Task<Farm?> GetByIdAsync(int id);
    Task<Farm> AddAsync(Farm farm);
    Task<bool> UpdateAsync(Farm farm);

    /// <summary>Marks land removed, or puts it back. Land is never hard-deleted — see
    /// <see cref="Farm.IsRemoved"/>.</summary>
    Task<bool> SetRemovedAsync(int id, bool removed);
}
