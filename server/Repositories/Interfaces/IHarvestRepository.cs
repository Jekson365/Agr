using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IHarvestRepository
{
    /// <summary>Every harvest, or just those of one kind when <paramref name="kind"/> is given.</summary>
    Task<IEnumerable<Harvest>> GetAllAsync(HarvestKind? kind = null);
    Task<Harvest?> GetByIdAsync(int id);
    Task<Harvest> AddAsync(Harvest harvest);
    Task<bool> UpdateAsync(Harvest harvest);
    Task<bool> DeleteAsync(int id);
}
