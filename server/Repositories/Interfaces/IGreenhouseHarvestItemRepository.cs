using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IGreenhouseHarvestItemRepository
{
    Task<IEnumerable<GreenhouseHarvestItem>> GetByHarvestAsync(int greenhouseHarvestId);
    Task<GreenhouseHarvestItem> AddAsync(GreenhouseHarvestItem item);
    Task<bool> UpdateAsync(GreenhouseHarvestItem item);
    Task<bool> DeleteAsync(int id);
}

public interface IGreenhouseHarvestSeedRepository
{
    Task<IEnumerable<GreenhouseHarvestSeed>> GetByHarvestAsync(int greenhouseHarvestId);

    /// <summary>Whether any harvest still records this seed as sown — checked before deleting it.</summary>
    Task<bool> ExistsForSeedAsync(int greenhouseSeedId);

    /// <summary>Records seed sown for a harvest: deducts the amount from the seed.</summary>
    Task<GreenhouseHarvestSeed> AddAsync(GreenhouseHarvestSeed harvestSeed);

    /// <summary>Reworks an existing row — the previous amount is returned to its seed before the
    /// new one is deducted, so switching seed or amount leaves both balances correct.</summary>
    Task<bool> UpdateAsync(GreenhouseHarvestSeed harvestSeed);

    /// <summary>Removes the row and returns its amount to the seed.</summary>
    Task<bool> DeleteAsync(int id);
}

public interface IGreenhouseHarvestResultRepository
{
    Task<IEnumerable<GreenhouseHarvestResult>> GetByHarvestAsync(int greenhouseHarvestId);

    /// <summary>Creation always contributes to stock — only allowed while Harvested (enforced by
    /// the controller).</summary>
    Task<GreenhouseHarvestResult> AddAsync(GreenhouseHarvestResult result);

    /// <summary>The previous amount is reversed and the new one applied, since editing is only
    /// allowed while Harvested — the previous contribution is always currently applied.</summary>
    Task<bool> UpdateAsync(GreenhouseHarvestResult result);

    /// <summary>Reverses the contribution first, if the owning harvest is still Harvested.</summary>
    Task<bool> DeleteAsync(int id);
}

public interface IGreenhouseHarvestChemicalRepository
{
    Task<IEnumerable<GreenhouseHarvestChemical>> GetByHarvestAsync(int greenhouseHarvestId);
    Task<GreenhouseHarvestChemical> AddAsync(GreenhouseHarvestChemical chemical);
    Task<bool> UpdateAsync(GreenhouseHarvestChemical chemical);
    Task<bool> DeleteAsync(int id);
}
