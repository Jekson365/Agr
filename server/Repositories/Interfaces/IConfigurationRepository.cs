using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IConfigurationRepository
{
    /// <summary>Every configuration for this tenant, in a stable order.</summary>
    Task<IEnumerable<Configuration>> GetAllAsync();

    /// <summary>
    /// Sets one setting's value, keyed by name rather than id — the client knows settings by the
    /// name it gates on, and ids differ between tenant databases. Returns the updated row, or null
    /// when no setting by that name exists.
    /// </summary>
    Task<Configuration?> SetValueAsync(string name, int value);
}
