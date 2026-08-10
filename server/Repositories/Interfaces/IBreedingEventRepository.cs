using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IBreedingEventRepository
{
    /// <summary>Every event, newest pairing first.</summary>
    Task<IEnumerable<BreedingEvent>> GetAllAsync();

    /// <summary>The events recorded from one group's breeding page.</summary>
    Task<IEnumerable<BreedingEvent>> GetByLivestockAsync(int livestockId);

    Task<BreedingEvent?> GetByIdAsync(int id);

    /// <summary>
    /// Whether this female is already in a pairing that has not finished — one still at
    /// <see cref="BreedingStatus.Breeding"/> or <see cref="BreedingStatus.PregnancyConfirmed"/>.
    /// Such an animal cannot be paired again until that event completes or fails.
    /// <paramref name="excludeId"/> skips the event being edited, so saving it unchanged is not
    /// reported as a clash with itself.
    /// </summary>
    Task<bool> HasOpenEventForFemaleAsync(int femaleAnimalId, int? excludeId = null);
    Task<BreedingEvent> AddAsync(BreedingEvent breedingEvent);
    Task<bool> UpdateAsync(BreedingEvent breedingEvent);
    /// <summary>
    /// Writes what the pairing produced, once. False when there is no such event or it already
    /// carries a result — the second recording of one birth is refused rather than added on.
    /// </summary>
    Task<bool> SetResultAsync(int id, int quantity, int livestockId);

    Task<bool> DeleteAsync(int id);
}
