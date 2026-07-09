using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IMedicalRecordRepository
{
    Task<IEnumerable<MedicalRecord>> GetByStockAsync(int stockId);
    Task<MedicalRecord> AddAsync(MedicalRecord record);
    Task<bool> DeleteAsync(int id);
}
