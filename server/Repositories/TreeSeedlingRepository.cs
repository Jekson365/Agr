using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class TreeSeedlingRepository(AppDbContext context, ITreeStockRepository treeStockRepository) : ITreeSeedlingRepository
{
    public async Task<IEnumerable<TreeSeedling>> GetAllAsync()
    {
        return await context.TreeSeedlings.AsNoTracking().OrderByDescending(s => s.SownDate).ThenByDescending(s => s.Id).ToListAsync();
    }

    public async Task<TreeSeedling?> GetByIdAsync(int id)
    {
        return await context.TreeSeedlings.FindAsync(id);
    }

    public async Task<TreeSeedling> AddAsync(TreeSeedling seedling)
    {
        StampStage(seedling, seedling.Stage, seedling.SownDate);
        context.TreeSeedlings.Add(seedling);
        await context.SaveChangesAsync();
        return seedling;
    }

    public async Task<bool> UpdateAsync(TreeSeedling seedling)
    {
        var existing = await context.TreeSeedlings.FindAsync(seedling.Id);
        if (existing is null)
        {
            return false;
        }

        var stageChanged = existing.Stage != seedling.Stage;

        existing.Type = seedling.Type;
        existing.Name = seedling.Name;
        existing.Quantity = seedling.Quantity;
        existing.Stage = seedling.Stage;
        existing.SownDate = seedling.SownDate;
        existing.SproutedDate = seedling.SproutedDate;
        existing.HardeningDate = seedling.HardeningDate;
        existing.ReadyDate = seedling.ReadyDate;
        existing.Location = seedling.Location;
        existing.Notes = seedling.Notes;

        if (stageChanged)
        {
            StampStage(existing, seedling.Stage, DateOnly.FromDateTime(DateTime.UtcNow));
        }

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.TreeSeedlings.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.TreeSeedlings.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<TreeSeedling?> PlantOutAsync(int id, TreeSeedlingPlantOutRequest request)
    {
        var existing = await context.TreeSeedlings.FindAsync(id);
        if (existing is null)
        {
            return null;
        }

        var date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        existing.Stage = NurseryStage.PlantedOut;
        existing.PlantedOutDate = date;
        existing.TreeStockId = request.TreeStockId;
        existing.PlantedOutQuantity = request.Quantity;
        existing.ReadyDate ??= date;

        await treeStockRepository.AdjustAmountRawAsync(request.TreeStockId, request.Quantity);

        context.TreeStockMovements.Add(new TreeStockMovement
        {
            TreeStockId = request.TreeStockId,
            Delta = request.Quantity,
            Source = StockMovementSource.Manual,
            Note = request.Note,
            Date = date,
        });

        await context.SaveChangesAsync();
        return existing;
    }

    private static void StampStage(TreeSeedling seedling, NurseryStage stage, DateOnly date)
    {
        switch (stage)
        {
            case NurseryStage.Sprouted:
                seedling.SproutedDate ??= date;
                break;
            case NurseryStage.Hardening:
                seedling.HardeningDate ??= date;
                break;
            case NurseryStage.Ready:
                seedling.ReadyDate ??= date;
                break;
        }
    }
}
