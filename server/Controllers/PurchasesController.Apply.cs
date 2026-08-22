using Server.Models;

namespace Server.Controllers;

public partial class PurchasesController
{
    /// <summary>Applies every line to its balance and stores them against the document, keeping
    /// the movement each one wrote so the document can be taken back later.</summary>
    private async Task ApplyAllAsync(List<PurchaseItem> items, PurchaseDocument document)
    {
        foreach (var item in items)
        {
            item.PurchaseDocumentId = document.Id;
            item.MovementId = await ApplyAsync(item, document);
        }
        await purchaseRepository.AddItemsAsync(items);
    }

    private async Task<int?> ApplyAsync(PurchaseItem item, PurchaseDocument document)
    {
        var note = $"{document.Seller} (#{document.Id})";

        switch (item.Kind)
        {
            case PurchaseItemKind.Livestock:
            {
                var head = (int)Math.Round(item.Quantity);
                var movement = await livestockMovementRepository.AddAsync(new LivestockMovement
                {
                    LivestockId = item.TargetId,
                    Delta = head,
                    Source = LivestockMovementSource.Purchase,
                    Date = document.Date,
                    Note = note,
                });
                await livestockDetailRepository.AddForGroupAsync(item.TargetId, head);
                return movement.Id;
            }

            case PurchaseItemKind.LivestockProduction:
                return (await productionMovementRepository.AddAsync(new ProductionMovement
                {
                    ProductionTypeId = item.TargetId,
                    UnitId = item.UnitId!.Value,
                    Delta = item.Quantity,
                    Source = ProductionMovementSource.Purchase,
                    Note = note,
                    Date = document.Date,
                })).Id;

            case PurchaseItemKind.TreeStock:
                await treeStockRepository.AdjustAmountRawAsync(item.TargetId, item.Quantity);
                return (await treeStockMovementRepository.AddAsync(new TreeStockMovement
                {
                    TreeStockId = item.TargetId,
                    Delta = item.Quantity,
                    Source = StockMovementSource.Purchase,
                    Note = note,
                    Date = document.Date,
                })).Id;

            case PurchaseItemKind.TreeProduct:
                return (await treeProductMovementRepository.AddAsync(new TreeProductMovement
                {
                    TreeProductId = item.TargetId,
                    Delta = item.Quantity,
                    Source = TreeProductMovementSource.Purchase,
                    Note = note,
                    Date = document.Date,
                })).Id;

            case PurchaseItemKind.Stock:
                await stockRepository.AdjustAmountRawAsync(item.TargetId, item.Quantity);
                return (await stockMovementRepository.AddAsync(new StockMovement
                {
                    StockId = item.TargetId,
                    Delta = item.Quantity,
                    Source = StockMovementSource.Purchase,
                    Note = note,
                    Date = document.Date,
                })).Id;

            case PurchaseItemKind.Seed:
                await seedRepository.AdjustAmountRawAsync(item.TargetId, item.Quantity);
                return (await seedMovementRepository.AddAsync(new SeedMovement
                {
                    SeedId = item.TargetId,
                    Delta = item.Quantity,
                    Source = SeedMovementSource.Purchase,
                })).Id;

            case PurchaseItemKind.Equipment:
            {
                var equipment = await equipmentRepository.GetByIdAsync(item.TargetId);
                if (equipment is not null)
                {
                    equipment.Quantity += (int)Math.Round(item.Quantity);
                    await equipmentRepository.UpdateAsync(equipment);
                }
                return null;
            }
            default:
                return null;
        }
    }
}
