using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class LivestockMovementRepository(AppDbContext context) : ILivestockMovementRepository
{
    public async Task<IEnumerable<LivestockMovement>> GetByLivestockAsync(int livestockId)
    {
        return await context.LivestockMovements
            .AsNoTracking()
            .Where(m => m.LivestockId == livestockId)
            // Newest first, with the id breaking ties so two entries on one day keep a stable
            // order rather than swapping places between loads.
            .OrderByDescending(m => m.Date)
            .ThenByDescending(m => m.Id)
            .ToListAsync();
    }

    /// <summary>
    /// Moves the group's count with the movement, in the caller's own SaveChanges so the two land
    /// together. Clamped at zero: a herd stuck there is recoverable, a negative one is not.
    /// </summary>
    private async Task ShiftCountAsync(int livestockId, int delta)
    {
        if (delta == 0)
        {
            return;
        }

        var group = await context.Livestock.FirstOrDefaultAsync(l => l.Id == livestockId);
        if (group is not null)
        {
            group.Count = Math.Max(0, group.Count + delta);
        }
    }

    public async Task<LivestockMovement> AddAsync(LivestockMovement movement)
    {
        movement.CreatedAt = DateTime.UtcNow;
        context.LivestockMovements.Add(movement);
        await ShiftCountAsync(movement.LivestockId, movement.Delta);
        await context.SaveChangesAsync();
        return movement;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.LivestockMovements.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // The count only reflects this row because the row exists; removing it takes that back.
        await ShiftCountAsync(existing.LivestockId, -existing.Delta);
        context.LivestockMovements.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
