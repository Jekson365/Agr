using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

/// <summary>
/// Reading a purchase request: what each line points at, and whether it still exists. Kept apart
/// from applying it, so nothing is written until every line has been checked.
/// </summary>
public partial class PurchasesController
{
    /// <summary>
    /// The request's lines as rows ready to be written, or the answer to send back instead.
    /// Everything is checked before anything is applied — the same reading serves a new document
    /// and a rewritten one.
    /// </summary>
    private async Task<(List<PurchaseItem>? Resolved, ActionResult? Failure)> ReadRequestAsync(CreatePurchaseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Seller))
        {
            return (null, BadRequest("A purchase needs a seller."));
        }
        if (request.Items is null || request.Items.Count == 0)
        {
            return (null, BadRequest("A purchase needs at least one item."));
        }

        var resolved = new List<PurchaseItem>();
        foreach (var line in request.Items)
        {
            if (line.Quantity <= 0)
            {
                return (null, BadRequest("Every item needs a positive quantity."));
            }
            if (line.Price < 0)
            {
                return (null, BadRequest("A price cannot be negative."));
            }
            if (!Enum.IsDefined(line.Kind))
            {
                return (null, BadRequest("Unknown purchase item kind."));
            }

            var name = await ResolveNameAsync(line);
            if (name is null)
            {
                return (null, Conflict("One of the items no longer exists."));
            }

            resolved.Add(new PurchaseItem
            {
                Kind = line.Kind,
                TargetId = line.TargetId,
                UnitId = line.UnitId,
                Name = name,
                Quantity = line.Quantity,
                Price = line.Price,
            });
        }

        return (resolved, null);
    }

    private async Task<string?> ResolveNameAsync(CreatePurchaseItemRequest line)
    {
        switch (line.Kind)
        {
            case PurchaseItemKind.Livestock:
            {
                var group = await livestockRepository.GetByIdAsync(line.TargetId);
                if (group is null || group.IsDeleted)
                {
                    return null;
                }
                return group.Name.Trim().Length > 0 ? group.Name.Trim() : group.Type;
            }
            case PurchaseItemKind.LivestockProduction:
            {
                if (line.UnitId is null)
                {
                    return null;
                }
                var type = (await productionTypeRepository.GetAllAsync()).FirstOrDefault(p => p.Id == line.TargetId);
                var unit = (await unitRepository.GetAllAsync()).FirstOrDefault(u => u.Id == line.UnitId);
                return type is null || unit is null ? null : type.Name;
            }
            case PurchaseItemKind.TreeStock:
            {
                var orchard = await treeStockRepository.GetByIdAsync(line.TargetId);
                if (orchard is null || orchard.IsDeleted)
                {
                    return null;
                }
                return orchard.Name.Trim().Length > 0 ? orchard.Name.Trim() : orchard.Type;
            }
            case PurchaseItemKind.TreeProduct:
            {
                var product = await treeProductRepository.GetByIdAsync(line.TargetId);
                return product?.Name;
            }
            case PurchaseItemKind.Stock:
            {
                var stock = await stockRepository.GetByIdAsync(line.TargetId);
                if (stock is null || stock.IsDeleted)
                {
                    return null;
                }
                return stock.Name.Trim().Length > 0 ? stock.Name.Trim() : stock.Type;
            }
            case PurchaseItemKind.Seed:
            {
                var seed = await seedRepository.GetByIdAsync(line.TargetId);
                if (seed is null || seed.IsDeleted)
                {
                    return null;
                }
                return seed.Name.Trim().Length > 0 ? seed.Name.Trim() : seed.Type;
            }
            case PurchaseItemKind.Equipment:
            {
                var equipment = await equipmentRepository.GetByIdAsync(line.TargetId);
                return equipment?.Name;
            }
            default:
                return null;
        }
    }
}
