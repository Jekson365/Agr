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
