using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IEquipmentRepository
{
    Task<IEnumerable<Equipment>> GetAllAsync();
    Task<Equipment?> GetByIdAsync(int id);
    Task<Equipment> AddAsync(Equipment equipment);
    Task<bool> UpdateAsync(Equipment equipment);
    Task<bool> DeleteAsync(int id);
}
