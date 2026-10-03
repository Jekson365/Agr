namespace Server.Models;

public static class ModuleAccess
{
    public static bool Allows(User user, FarmModule module) =>
        user.Plan != StoragePlan.Free || user.AllModulesIncluded || user.FreeModule == module;

    public static List<FarmModule> AllowedFor(User user) =>
        Enum.GetValues<FarmModule>().Where(module => Allows(user, module)).ToList();

    public static bool NeedsChoice(User user) =>
        user.HasManagementAccess
        && user.Plan == StoragePlan.Free
        && !user.AllModulesIncluded
        && user.FreeModule is null;
}
