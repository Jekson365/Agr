using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Repositories;

public partial class WineBatchRepository
{
    public async Task<List<WineBatchSummary>> GetSummariesAsync(bool includeDeleted, int? id = null)
    {
        var batches = await context.WineBatches
            .AsNoTracking()
            .Where(b => (includeDeleted || !b.IsDeleted) && (id == null || b.Id == id))
            .OrderByDescending(b => b.Vintage)
            .ThenByDescending(b => b.Id)
            .ToListAsync();
        var ids = batches.Select(b => b.Id).ToList();

        var grapes = await context.WineBatchGrapes
            .Where(g => ids.Contains(g.WineBatchId))
            .GroupBy(g => g.WineBatchId)
            .Select(g => new { BatchId = g.Key, Kg = g.Sum(x => x.Amount) })
            .ToDictionaryAsync(x => x.BatchId, x => x.Kg);

        var ledger = await context.WineMovements
            .Where(m => ids.Contains(m.WineBatchId))
            .GroupBy(m => m.WineBatchId)
            .Select(g => new
            {
                BatchId = g.Key,
                Liters = g.Sum(x => x.Delta),
                Bottles = g.Sum(x => x.BottleDelta),
                Produced = g.Sum(x => x.Source == WineMovementSource.Production ? x.Delta : 0m),
                Revenue = g.Sum(x => x.Revenue ?? 0m),
            })
            .ToDictionaryAsync(x => x.BatchId);

        var bottlings = await context.WineBottlings
            .Where(b => ids.Contains(b.WineBatchId))
            .GroupBy(b => b.WineBatchId)
            .Select(g => new { BatchId = g.Key, Count = g.Count(), Bottles = g.Sum(x => x.Count), Cost = g.Sum(x => x.Cost ?? 0m) })
            .ToDictionaryAsync(x => x.BatchId);

        var operations = await context.WineOperations
            .Where(o => ids.Contains(o.WineBatchId))
            .GroupBy(o => o.WineBatchId)
            .Select(g => new { BatchId = g.Key, Count = g.Count(), Cost = g.Sum(x => x.Cost ?? 0m) })
            .ToDictionaryAsync(x => x.BatchId);

        var readings = (await context.WineMeasurements
                .AsNoTracking()
                .Where(m => ids.Contains(m.WineBatchId))
                .OrderByDescending(m => m.Date)
                .ThenByDescending(m => m.Id)
                .ToListAsync())
            .ToLookup(m => m.WineBatchId);

        return batches.Select(batch =>
        {
            var totals = ledger.GetValueOrDefault(batch.Id);
            var bottled = bottlings.GetValueOrDefault(batch.Id);
            var work = operations.GetValueOrDefault(batch.Id);
            var batchReadings = readings[batch.Id].ToList();
            return new WineBatchSummary
            {
                Id = batch.Id,
                Name = batch.Name,
                Vintage = batch.Vintage,
                Color = batch.Color,
                Method = batch.Method,
                Stage = batch.Stage,
                StartDate = batch.StartDate,
                Notes = batch.Notes,
                IsDeleted = batch.IsDeleted,
                GrapeKg = grapes.GetValueOrDefault(batch.Id),
                ProducedLiters = totals?.Produced ?? 0m,
                Liters = totals?.Liters ?? 0m,
                Bottles = totals?.Bottles ?? 0,
                LatestSugar = batchReadings.FirstOrDefault(r => r.Sugar != null)?.Sugar,
                LatestAlcohol = batchReadings.FirstOrDefault(r => r.Alcohol != null)?.Alcohol,
                LatestMeasuredOn = batchReadings.FirstOrDefault()?.Date,
                ReadingCount = batchReadings.Count,
                BottlingCount = bottled?.Count ?? 0,
                OperationCount = work?.Count ?? 0,
                BottledCount = bottled?.Bottles ?? 0,
                Costs = (bottled?.Cost ?? 0m) + (work?.Cost ?? 0m),
                Revenue = totals?.Revenue ?? 0m,
            };
        }).ToList();
    }
}
