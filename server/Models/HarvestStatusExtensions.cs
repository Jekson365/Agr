namespace Server.Models;

/// <summary>Where the two stages that follow the pick behave alike. A result and its grading sheet
/// describe what came off the field, so both are editable from <see cref="HarvestStatus.Harvested"/>
/// onwards — only the balances themselves wait for
/// <see cref="HarvestStatus.TransferredToBalance"/>.</summary>
public static class HarvestStatusExtensions
{
    public static bool IsPicked(this HarvestStatus status)
    {
        return status is HarvestStatus.Harvested or HarvestStatus.TransferredToBalance;
    }

    public static bool CountsInBalance(this HarvestStatus status)
    {
        return status is HarvestStatus.TransferredToBalance;
    }
}
