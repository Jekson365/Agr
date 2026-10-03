using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

public partial class TreeStocksController
{
    [HttpPost]
    public async Task<ActionResult<TreeStock>> Create(TreeStock stock)
    {
        stock.Name = stock.Name.Trim();

        // An orchard is a count of trees, so it can't start below zero — and a negative opening
        // amount would be stored without a movement to explain it, leaving the Fruit page and the
        // Balance page (which sums the ledger) reading the row as two different numbers forever.
        if (stock.Amount < 0)
        {
            return BadRequest("Amount cannot be negative.");
        }

        // An orchard is the trees that yield one product, so which product is part of recording it
        // rather than something to fill in later: until one is named, a harvest that picks these
        // trees has nowhere to book what it took (see HarvestTreeRepository.SyncProduceAsync) and
        // the produce is silently lost.
        if (stock.TreeProductId is null)
        {
            return BadRequest(ProduceRequiredMessage);
        }

        await using var planLock = await planLimitLock.AcquireAsync(PlanResource.Fruit);
        var invalid = await ValidateAsync(stock);
        if (invalid is not null)
        {
            return Conflict(invalid);
        }

        try
        {
            await planLimitService.EnsureModuleAllowedAsync(FarmModule.Fruit);
            var currentCount = (await treeStockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddFruitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var created = await treeStockRepository.AddAsync(stock);
        await planLock.CommitAsync();
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
