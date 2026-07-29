using Server.Models;

namespace Server.Repositories.Interfaces;

/// <summary>
/// Owns what a harvest currently puts into stock. Two rules decide it, and this is the only place
/// either is applied: yield counts only while the harvest is <see cref="HarvestStatus.Harvested"/>,
/// and each good it covers counts exactly once — the recorded <see cref="HarvestResult"/> where
/// there is one, the planned <see cref="HarvestItem"/> where there isn't. Call it after anything
/// that could change that answer (the status, a plan, a result) and the movements and the stock
/// amounts are brought back into line, whichever way they moved.
/// </summary>
public interface IHarvestStockSync
{
    /// <summary>
    /// Rewrites a harvest's contribution to match what it now records. The two exclusions name a
    /// row that is about to be deleted: its movement has to come off the books while the row is
    /// still here, since deleting it cascades the movement away without giving back the amount it
    /// added — and its good may have a plan waiting to take over.
    /// </summary>
    Task SyncAsync(int harvestId, int? excludeItemId = null, int? excludeResultId = null);

    /// <summary>Takes the whole harvest off the books whatever its status — for one about to be
    /// deleted, whose rows would otherwise cascade away with their amounts still counted.</summary>
    Task ClearAsync(int harvestId);
}
