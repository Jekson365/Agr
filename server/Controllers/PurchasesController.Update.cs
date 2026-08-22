using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

public partial class PurchasesController
{
    /// <summary>
    /// Rewrites a document: what it says, and what it did to the balances.
    ///
    /// The old lines are taken back and the new ones applied fresh rather than diffed. A line can
    /// change its category, its target, its quantity and its price all at once, and every one of
    /// those lands in a different ledger — reconciling them pairwise would be several ways to get
    /// the same answer and one more place for the answer to be wrong. Both halves run in one
    /// transaction, so a document is never left holding one and not the other.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PurchaseDocumentDto>> Update(int id, CreatePurchaseRequest request)
    {
        var document = await purchaseRepository.GetDocumentAsync(id);
        if (document is null)
        {
            return NotFound();
        }

        // The new lines are read before anything is touched: a target that has since gone is a
        // refusal, and refusing after the old lines came off the books would be a rollback of its
        // own.
        var (resolved, failure) = await ReadRequestAsync(request);
        if (failure is not null)
        {
            return failure;
        }

        var existing = await purchaseRepository.GetItemsAsync(id);
        if (await FirstRevertBlockerAsync(existing) is string blocked)
        {
            return Conflict(blocked);
        }

        await using var transaction = await context.Database.BeginTransactionAsync();

        foreach (var item in existing)
        {
            await RevertAsync(item);
        }
        await purchaseRepository.DeleteItemsAsync(id);

        document.Seller = request.Seller.Trim();
        document.Date = request.Date ?? document.Date;
        document.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        await purchaseRepository.UpdateDocumentAsync(document);

        await ApplyAllAsync(resolved!, document);
        await transaction.CommitAsync();

        return Ok(await purchaseRepository.GetByIdAsync(id));
    }
}
