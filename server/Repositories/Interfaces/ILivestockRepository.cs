using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockRepository
{
    /// <summary>
    /// The groups the farm keeps. Deleted ones are left out unless <paramref name="includeDeleted"/>
    /// asks for them, which only the pages that put a name to history already collected from a
    /// group need — the balance's removed-holdings view among them.
    /// </summary>
    Task<IEnumerable<Livestock>> GetAllAsync(bool includeDeleted = false);

    /// <summary>Any group, deleted or not — history pages look one up by the id they hold.</summary>
    Task<Livestock?> GetByIdAsync(int id);

    /// <summary>Whether another group still on the page already uses this name (compared
    /// case-insensitively). <paramref name="excludeId"/> skips the group being edited, so saving it
    /// unchanged isn't reported as a clash with itself. A removed group is listed nowhere, so it
    /// holds no claim on its name.</summary>
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null);
    Task<List<int>> GetProduceIdsAsync(int livestockId);
    Task<Livestock> AddAsync(Livestock livestock);
    Task<bool> UpdateAsync(Livestock livestock);

    /// <summary>
    /// Moves a group's head count by <paramref name="delta"/>. The count is settled at creation and
    /// ignored on an ordinary update, so this is the only way it grows: a breeding result recorded
    /// as a number of head rather than as individual animals.
    /// </summary>
    Task<bool> AdjustCountAsync(int livestockId, int delta);

    /// <summary>
    /// Marks the group deleted instead of removing the row: every production collected from it,
    /// its animals and their records all cascade on a real delete (see
    /// <see cref="Server.Data.AppDbContext"/>), and that history is worth keeping. Returns false
    /// when no group with that id exists.
    /// </summary>
    Task<bool> SoftDeleteAsync(int id);
}
