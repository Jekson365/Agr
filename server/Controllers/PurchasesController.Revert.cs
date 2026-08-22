using Server.Models;

namespace Server.Controllers;

public partial class PurchasesController
{
    private const string SpentMessage = "This purchase can no longer be rolled back — part of what it added is already used up.";
    private const string UntrackedMessage = "This purchase was recorded before it could be rolled back.";

    /// <summary>The first reason these lines cannot be taken back, or null when they all can.
    /// Asked of every line before any of them moves, so a refusal costs nothing.</summary>
    private async Task<string?> FirstRevertBlockerAsync(IEnumerable<PurchaseItem> items)
    {
        foreach (var item in items)
        {
            if (await BlockedFromRevertAsync(item) is string blocked)
            {
                return blocked;
            }
        }
        return null;
    }

    private async Task<string?> BlockedFromRevertAsync(PurchaseItem item)
    {
        if (item.MovementId is null && item.Kind != PurchaseItemKind.Equipment)
        {
            return UntrackedMessage;
        }

        switch (item.Kind)
        {
            case PurchaseItemKind.Livestock:
            {
                var group = await livestockRepository.GetByIdAsync(item.TargetId);
                return group is not null && group.Count < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.LivestockProduction:
            {
                var balance = await productionMovementRepository.GetBalanceAsync(item.TargetId, item.UnitId ?? 0);
                return balance < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.TreeStock:
            {
                var orchard = await treeStockRepository.GetByIdAsync(item.TargetId);
                return orchard is not null && orchard.Amount < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.TreeProduct:
            {
                var balance = await treeProductMovementRepository.GetBalanceAsync(item.TargetId);
                return balance < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.Stock:
            {
                var stock = await stockRepository.GetByIdAsync(item.TargetId);
                return stock is not null && stock.Amount < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.Seed:
            {
                var seed = await seedRepository.GetByIdAsync(item.TargetId);
                return seed is not null && seed.Amount < item.Quantity ? SpentMessage : null;
            }
            case PurchaseItemKind.Equipment:
            {
                var equipment = await equipmentRepository.GetByIdAsync(item.TargetId);
                return equipment is not null && equipment.Quantity < item.Quantity ? SpentMessage : null;
            }
            default:
                return null;
        }
    }

    private async Task RevertAsync(PurchaseItem item)
    {
        switch (item.Kind)
        {
            case PurchaseItemKind.Livestock:
                await livestockMovementRepository.DeleteAsync(item.MovementId!.Value);
                await livestockDetailRepository.RemoveUnreferencedAsync(item.TargetId, (int)Math.Round(item.Quantity));
                break;

            case PurchaseItemKind.LivestockProduction:
                await productionMovementRepository.DeleteAsync(item.MovementId!.Value);
                break;

            case PurchaseItemKind.TreeStock:
                await treeStockMovementRepository.DeleteAsync(item.MovementId!.Value);
                await treeStockRepository.AdjustAmountRawAsync(item.TargetId, -item.Quantity);
                break;

            case PurchaseItemKind.TreeProduct:
                await treeProductMovementRepository.DeleteAsync(item.MovementId!.Value);
                break;

            case PurchaseItemKind.Stock:
                await stockMovementRepository.DeleteAsync(item.MovementId!.Value);
                await stockRepository.AdjustAmountRawAsync(item.TargetId, -item.Quantity);
                break;

            case PurchaseItemKind.Seed:
                await seedMovementRepository.DeleteAsync(item.MovementId!.Value);
                await seedRepository.AdjustAmountRawAsync(item.TargetId, -item.Quantity);
                break;

            case PurchaseItemKind.Equipment:
            {
                var equipment = await equipmentRepository.GetByIdAsync(item.TargetId);
                if (equipment is not null)
                {
                    equipment.Quantity -= (int)Math.Round(item.Quantity);
                    await equipmentRepository.UpdateAsync(equipment);
                }
                break;
            }
        }
    }
}
