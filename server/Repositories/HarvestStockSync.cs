using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

/// <inheritdoc cref="IHarvestStockSync"/>
public class HarvestStockSync(
    AppDbContext context,
    IStockRepository stockRepository,
    IStockMovementRepository stockMovementRepository,
    ITreeStockRepository treeStockRepository,
    ITreeStockMovementRepository treeStockMovementRepository) : IHarvestStockSync
{
    /// <summary>Which of the harvest's rows a movement answers to. What links a wanted contribution
    /// to the movement already carrying it, so an edit rewrites that row instead of logging a second
    /// one. Only a result is ever wanted now, but a movement an item wrote before that still keys
    /// back to its item — which is how the reconcile finds it to reverse it.</summary>
    private readonly record struct RowKey(bool IsResult, int RowId);

    /// <summary>A contribution a row should be making: which ledger it lands in (plant stock or
    /// fruit trees), which good, and how much.</summary>
    private readonly record struct Contribution(bool IsTree, int GoodId, decimal Delta);

    /// <summary>A movement already on the books for one of those rows.</summary>
    private readonly record struct Carried(bool IsTree, int GoodId, int MovementId, decimal Delta);

    public Task SyncAsync(int harvestId, int? excludeResultId = null)
    {
        return ReconcileAsync(harvestId, clear: false, excludeResultId);
    }

    public Task ClearAsync(int harvestId)
    {
        return ReconcileAsync(harvestId, clear: true, null);
    }

    /// <summary>
    /// Works out what the harvest should be contributing, compares it against what it already is,
    /// and moves only the difference. Doing it as a comparison rather than an apply/undo pair is
    /// what keeps one movement per row as amounts change — and makes calling it twice harmless.
    /// The planned items are still read: they carry no yield of their own, but movements one of
    /// them wrote under the old rule are found through them and reversed.
    /// </summary>
    private async Task ReconcileAsync(int harvestId, bool clear, int? excludeResultId)
    {
        var items = await context.HarvestItems.AsNoTracking().Where(i => i.HarvestId == harvestId).ToListAsync();
        var results = await context.HarvestResults.AsNoTracking().Where(r => r.HarvestId == harvestId).ToListAsync();

        var wanted = clear ? [] : await DesiredAsync(harvestId, results, excludeResultId);
        var carried = await CarriedAsync(items, results);

        foreach (var (key, have) in carried)
        {
            // Still wanted, on the same good and the same ledger: edit the movement in place and
            // move only the difference, so the history keeps one entry per row.
            if (wanted.TryGetValue(key, out var want) && want.IsTree == have.IsTree && want.GoodId == have.GoodId)
            {
                if (want.Delta != have.Delta)
                {
                    await AdjustAsync(have.IsTree, have.GoodId, want.Delta - have.Delta);
                    await UpdateMovementAsync(key, want);
                }
                wanted.Remove(key);
                continue;
            }

            // Gone, retargeted at another good, or moved to the other ledger — take it back off,
            // and let the pass below write whatever is wanted now, in whichever table that is.
            await AdjustAsync(have.IsTree, have.GoodId, -have.Delta);
            await DeleteMovementAsync(have);
        }

        foreach (var (key, want) in wanted)
        {
            await AdjustAsync(want.IsTree, want.GoodId, want.Delta);
            await AddMovementAsync(key, want);
        }
    }

    /// <summary>What the harvest should be contributing as it now stands: nothing at all unless it
    /// is Harvested, and then its recorded results — see <see cref="IHarvestStockSync"/>.</summary>
    private async Task<Dictionary<RowKey, Contribution>> DesiredAsync(
        int harvestId,
        List<HarvestResult> results,
        int? excludeResultId)
    {
        var wanted = new Dictionary<RowKey, Contribution>();

        var status = await context.Harvests
            .AsNoTracking()
            .Where(h => h.Id == harvestId)
            .Select(h => (HarvestStatus?)h.Status)
            .FirstOrDefaultAsync();
        if (status != HarvestStatus.Harvested)
        {
            return wanted;
        }

        foreach (var result in results)
        {
            if (result.Id == excludeResultId || GoodOf(result.StockId, result.TreeStockId) is not { } good)
            {
                continue;
            }

            wanted[new RowKey(true, result.Id)] = new Contribution(good.IsTree, good.GoodId, result.Amount);
        }

        // Planned items are deliberately absent: a plan is a forecast, and stock only counts what
        // was actually picked. Anything a plan wrote before that rule is reversed by the pass in
        // ReconcileAsync, which finds the movement carried but no longer wanted.
        return wanted;
    }

    /// <summary>The movements the harvest's rows are already carrying. A row owns at most one, so
    /// a second is a leftover: it is reversed here rather than left inflating the balance.</summary>
    private async Task<Dictionary<RowKey, Carried>> CarriedAsync(List<HarvestItem> items, List<HarvestResult> results)
    {
        var carried = new Dictionary<RowKey, Carried>();

        var itemIds = items.Select(i => (int?)i.Id).ToList();
        var resultIds = results.Select(r => (int?)r.Id).ToList();

        var stockRows = await context.StockMovements
            .AsNoTracking()
            .Where(m => itemIds.Contains(m.HarvestItemId) || resultIds.Contains(m.HarvestResultId))
            .ToListAsync();
        foreach (var movement in stockRows)
        {
            await KeepOneAsync(
                carried,
                KeyOf(movement.HarvestItemId, movement.HarvestResultId),
                new Carried(false, movement.StockId, movement.Id, movement.Delta));
        }

        var treeRows = await context.TreeStockMovements
            .AsNoTracking()
            .Where(m => itemIds.Contains(m.HarvestItemId) || resultIds.Contains(m.HarvestResultId))
            .ToListAsync();
        foreach (var movement in treeRows)
        {
            await KeepOneAsync(
                carried,
                KeyOf(movement.HarvestItemId, movement.HarvestResultId),
                new Carried(true, movement.TreeStockId, movement.Id, movement.Delta));
        }

        return carried;
    }

    private async Task KeepOneAsync(Dictionary<RowKey, Carried> carried, RowKey key, Carried entry)
    {
        if (carried.TryAdd(key, entry))
        {
            return;
        }

        await AdjustAsync(entry.IsTree, entry.GoodId, -entry.Delta);
        await DeleteMovementAsync(entry);
    }

    /// <summary>Which good a result row names. Null when it names neither, which the controllers
    /// refuse but older rows could still hold.</summary>
    private static (bool IsTree, int GoodId)? GoodOf(int? stockId, int? treeStockId)
    {
        if (stockId is int id)
        {
            return (false, id);
        }
        if (treeStockId is int treeStockIdValue)
        {
            return (true, treeStockIdValue);
        }
        return null;
    }

    private static RowKey KeyOf(int? harvestItemId, int? harvestResultId)
    {
        return harvestResultId is int resultId ? new RowKey(true, resultId) : new RowKey(false, harvestItemId ?? 0);
    }

    private async Task AdjustAsync(bool isTree, int goodId, decimal delta)
    {
        if (delta == 0)
        {
            return;
        }

        if (isTree)
        {
            await treeStockRepository.AdjustAmountRawAsync(goodId, delta);
        }
        else
        {
            await stockRepository.AdjustAmountRawAsync(goodId, delta);
        }
    }

    private async Task AddMovementAsync(RowKey key, Contribution want)
    {
        if (want.IsTree)
        {
            await treeStockMovementRepository.AddAsync(new TreeStockMovement
            {
                TreeStockId = want.GoodId,
                HarvestItemId = key.IsResult ? null : key.RowId,
                HarvestResultId = key.IsResult ? key.RowId : null,
                Delta = want.Delta,
                Source = StockMovementSource.Harvest,
            });
            return;
        }

        await stockMovementRepository.AddAsync(new StockMovement
        {
            StockId = want.GoodId,
            HarvestItemId = key.IsResult ? null : key.RowId,
            HarvestResultId = key.IsResult ? key.RowId : null,
            Delta = want.Delta,
            Source = StockMovementSource.Harvest,
        });
    }

    private async Task UpdateMovementAsync(RowKey key, Contribution want)
    {
        if (want.IsTree)
        {
            if (key.IsResult)
            {
                await treeStockMovementRepository.UpdateForHarvestResultAsync(key.RowId, want.GoodId, want.Delta);
            }
            else
            {
                await treeStockMovementRepository.UpdateForHarvestItemAsync(key.RowId, want.GoodId, want.Delta);
            }
            return;
        }

        if (key.IsResult)
        {
            await stockMovementRepository.UpdateForHarvestResultAsync(key.RowId, want.GoodId, want.Delta);
        }
        else
        {
            await stockMovementRepository.UpdateForHarvestItemAsync(key.RowId, want.GoodId, want.Delta);
        }
    }

    private async Task DeleteMovementAsync(Carried have)
    {
        if (have.IsTree)
        {
            await treeStockMovementRepository.DeleteAsync(have.MovementId);
        }
        else
        {
            await stockMovementRepository.DeleteAsync(have.MovementId);
        }
    }
}
