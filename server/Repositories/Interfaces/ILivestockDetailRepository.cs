using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockDetailRepository
{
    /// <summary>
    /// Records the offspring of a breeding event: <paramref name="quantity"/> copies of
    /// <paramref name="template"/> in its group, in one write. Codes are generated from
    /// <paramref name="codePrefix"/>, skipping any the group already uses.
    ///
    /// The group's head count is not touched here — it moves with the Birth movement recorded
    /// alongside, so the ledger stays the single account of how a group reached its count.
    /// </summary>
    Task<IReadOnlyList<LivestockDetail>> AddOffspringAsync(LivestockDetail template, int quantity, string codePrefix);

    /// <summary>Every animal on the farm, across all groups.</summary>
    Task<IEnumerable<LivestockDetail>> GetAllAsync();

    Task<IEnumerable<LivestockDetail>> GetByLivestockAsync(int livestockId);
    Task<LivestockDetail?> GetByIdAsync(int id);
    Task<LivestockDetail> AddAsync(LivestockDetail detail);
    Task<bool> UpdateAsync(LivestockDetail detail);
    Task<bool> DeleteAsync(int id);
}
