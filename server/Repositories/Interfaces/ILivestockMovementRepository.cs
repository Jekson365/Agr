using Server.Models;

namespace Server.Repositories.Interfaces;

public interface ILivestockMovementRepository
{
    /// <summary>One group's ledger, newest first.</summary>
    Task<IEnumerable<LivestockMovement>> GetByLivestockAsync(int livestockId);

    /// <summary>One entry, for a caller that has to know what it is before acting on it.</summary>
    Task<LivestockMovement?> GetByIdAsync(int id);

    /// <summary>
    /// Records a change and moves the group's head count by the same amount, in one write. Every
    /// caller goes through here — the ledger is only worth reading if nothing moves the count
    /// behind its back.
    /// </summary>
    Task<LivestockMovement> AddAsync(LivestockMovement movement);

    /// <summary>Removes a movement and takes its effect on the count back with it.</summary>
    Task<bool> DeleteAsync(int id);
}
