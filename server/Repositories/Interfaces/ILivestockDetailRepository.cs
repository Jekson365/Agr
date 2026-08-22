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

    /// <summary>
    /// Adds <paramref name="quantity"/> blank animals to a group, numbered from its kind's
    /// initial the way a new group's opening head are. For head arriving after the group was
    /// created — bought in, given, or corrected upwards — so the per-animal pages have a row per
    /// animal rather than a count with nothing behind it.
    ///
    /// The head count is not touched here: the movement that brought them in already carries it.
    /// </summary>
    Task<IReadOnlyList<LivestockDetail>> AddForGroupAsync(int livestockId, int quantity);

    /// <summary>
    /// Takes back a group's last <paramref name="quantity"/> animals, keeping any that something
    /// else already records against — a vet visit, a weight, a production batch, a breeding event,
    /// or being another animal's parent. Those rows would go with the animal, so an entry made
    /// against one is what keeps it, and keeping one does not pull an older animal in to make up
    /// the number. Returns how many went.
    /// </summary>
    Task<int> RemoveUnreferencedAsync(int livestockId, int quantity);

    /// <summary>Every animal on the farm, across all groups.</summary>
    Task<IEnumerable<LivestockDetail>> GetAllAsync();

    Task<IEnumerable<LivestockDetail>> GetByLivestockAsync(int livestockId);
    Task<LivestockDetail?> GetByIdAsync(int id);
    Task<LivestockDetail> AddAsync(LivestockDetail detail);
    Task<bool> UpdateAsync(LivestockDetail detail);
    Task<bool> DeleteAsync(int id);
}
