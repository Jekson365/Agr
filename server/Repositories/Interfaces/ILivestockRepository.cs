using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockRepository
{
    Task<IEnumerable<Livestock>> GetAllAsync();
    Task<Livestock?> GetByIdAsync(int id);

    /// <summary>Whether another group already uses this name (compared case-insensitively).
    /// <paramref name="excludeId"/> skips the group being edited, so saving it unchanged isn't
    /// reported as a clash with itself.</summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);
    Task<Livestock> AddAsync(Livestock livestock);
    Task<bool> UpdateAsync(Livestock livestock);
    Task<bool> DeleteAsync(int id);
}
