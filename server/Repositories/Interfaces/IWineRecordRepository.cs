namespace Server.Repositories.Interfaces;

public interface IWineRecordRepository<T> where T : class
{
    Task<IEnumerable<T>> GetAsync(int? wineBatchId = null);
    Task<T?> GetByIdAsync(int id);
    Task<T> AddAsync(T record);
    Task UpdateAsync(T record);
    Task DeleteAsync(T record);
}
