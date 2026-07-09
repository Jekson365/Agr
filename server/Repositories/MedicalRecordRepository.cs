using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class MedicalRecordRepository(AppDbContext context) : IMedicalRecordRepository
{
    public async Task<IEnumerable<MedicalRecord>> GetByStockAsync(int stockId)
    {
        return await context.MedicalRecords
            .AsNoTracking()
            .Where(r => r.StockId == stockId)
            .OrderBy(r => r.VisitDate)
            .ToListAsync();
    }

    public async Task<MedicalRecord> AddAsync(MedicalRecord record)
    {
        context.MedicalRecords.Add(record);
        await context.SaveChangesAsync();
        return record;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.MedicalRecords.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.MedicalRecords.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
