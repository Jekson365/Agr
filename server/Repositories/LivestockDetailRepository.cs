using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockDetailRepository(AppDbContext context) : ILivestockDetailRepository
{
    public async Task<IEnumerable<LivestockDetail>> GetByLivestockAsync(int livestockId)
    {
        return await context.LivestockDetails
            .AsNoTracking()
            .Where(d => d.LivestockId == livestockId)
            .OrderBy(d => d.Id)
            .ToListAsync();
    }

    public async Task<LivestockDetail?> GetByIdAsync(int id)
    {
        return await context.LivestockDetails.FindAsync(id);
    }

    public async Task<IEnumerable<LivestockDetail>> GetAllAsync()
    {
        return await context.LivestockDetails.AsNoTracking().OrderBy(d => d.Id).ToListAsync();
    }

    public async Task<LivestockDetail> AddAsync(LivestockDetail detail)
    {
        context.LivestockDetails.Add(detail);
        await context.SaveChangesAsync();
        return detail;
    }

    public async Task<IReadOnlyList<LivestockDetail>> AddOffspringAsync(
        LivestockDetail template,
        int quantity,
        string codePrefix)
    {
        // Codes are not unique in the schema, but two animals in one group sharing a tag is still
        // a mess to live with — so the numbering steps over whatever the group already uses.
        var taken = await context.LivestockDetails
            .Where(d => d.LivestockId == template.LivestockId)
            .Select(d => d.Code)
            .ToListAsync();
        var used = new HashSet<string>(taken, StringComparer.OrdinalIgnoreCase);

        var offspring = new List<LivestockDetail>(quantity);
        var next = 1;
        for (var i = 0; i < quantity; i++)
        {
            string code;
            do
            {
                code = $"{codePrefix}-{next++}";
            }
            while (!used.Add(code));

            offspring.Add(new LivestockDetail
            {
                LivestockId = template.LivestockId,
                Code = code,
                ImagePath = template.ImagePath,
                BornDate = template.BornDate,
                Gender = template.Gender,
                ParentOneId = template.ParentOneId,
                ParentTwoId = template.ParentTwoId,
            });
        }

        context.LivestockDetails.AddRange(offspring);

        // The head count is deliberately not touched here. It moves with the Birth movement the
        // breeding controller records alongside these animals, so the ledger is the one account of
        // how a group reached its count rather than one of two.

        await context.SaveChangesAsync();
        return offspring;
    }

    public async Task<IReadOnlyList<LivestockDetail>> AddForGroupAsync(int livestockId, int quantity)
    {
        if (quantity <= 0)
        {
            return [];
        }

        var type = await context.Livestock
            .Where(l => l.Id == livestockId)
            .Select(l => l.Type)
            .FirstOrDefaultAsync();

        var prefix = type?.Trim() is { Length: > 0 } named ? char.ToUpperInvariant(named[0]).ToString() : "A";
        return await AddOffspringAsync(new LivestockDetail { LivestockId = livestockId }, quantity, prefix);
    }

    public async Task<int> RemoveUnreferencedAsync(int livestockId, int quantity)
    {
        if (quantity <= 0)
        {
            return 0;
        }

        // The window is the last `quantity` animals of the group, and the removal happens inside
        // it. Filtering first and taking after would reach past a kept animal into an older one
        // that was never part of what is being taken back.
        var newest = await context.LivestockDetails
            .Where(d => d.LivestockId == livestockId)
            .OrderByDescending(d => d.Id)
            .Take(quantity)
            .Select(d => d.Id)
            .ToListAsync();

        var free = await context.LivestockDetails
            .Where(d => newest.Contains(d.Id))
            .Where(d => !context.MedicalRecords.Any(m => m.StockId == d.Id))
            .Where(d => !context.StockHistories.Any(h => h.StockId == d.Id))
            .Where(d => !context.AnimalProductions.Any(p => p.AnimalId == d.Id))
            .Where(d => !context.BreedingEvents.Any(b => b.MaleAnimalId == d.Id || b.FemaleAnimalId == d.Id))
            .Where(d => !context.LivestockDetails.Any(c => c.ParentOneId == d.Id || c.ParentTwoId == d.Id))
            .ToListAsync();

        if (free.Count == 0)
        {
            return 0;
        }

        context.LivestockDetails.RemoveRange(free);
        await context.SaveChangesAsync();
        return free.Count;
    }

    public async Task<bool> UpdateAsync(LivestockDetail detail)
    {
        var existing = await context.LivestockDetails.FindAsync(detail.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Code = detail.Code;
        existing.ImagePath = detail.ImagePath;
        existing.BornDate = detail.BornDate;
        existing.Gender = detail.Gender;
        // LivestockId is fixed once created — a detail can't move between groups.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.LivestockDetails.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.LivestockDetails.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
