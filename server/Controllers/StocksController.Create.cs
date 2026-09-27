using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

public partial class StocksController
{
    [HttpPost]
    public async Task<ActionResult<Stock>> Create(Stock stock)
    {
        var invalid = Validate(stock.Type, stock.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        await using var planLock = await planLimitLock.AcquireAsync(PlanResource.Stock);
        try
        {
            var currentCount = (await stockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddStockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var created = await stockRepository.AddAsync(stock);
        await planLock.CommitAsync();
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Creates a stock and the seed for the same crop in one call. Greenhouse stock is added this
    /// way: the seed isn't optional there, and a client that created the stock and then failed to
    /// send the seed would leave the pair half-made.
    /// </summary>
    [HttpPost("with-seed")]
    public async Task<ActionResult<StockWithSeedResponse>> CreateWithSeed(StockWithSeedRequest request)
    {
        var invalid = Validate(request.Type, request.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }
        if (request.SeedAmount < 0)
        {
            return BadRequest("Seed amount cannot be negative.");
        }
        if (!Enum.IsDefined(request.Unit) || !Enum.IsDefined(request.SeedUnit))
        {
            return BadRequest("Unknown unit.");
        }

        await using var planLock = await planLimitLock.AcquireAsync(PlanResource.Stock);
        try
        {
            var currentCount = (await stockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddStockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var type = request.Type.Trim();
        var name = request.Name.Trim();

        var stock = await stockRepository.AddAsync(new Stock
        {
            Type = type,
            Name = name,
            Amount = request.Amount,
            Unit = request.Unit,
        });

        // Same crop and same label, so the seed and the produce it grows into read identically.
        var seed = await seedRepository.AddAsync(new Seed
        {
            Type = type,
            Name = name,
            Amount = request.SeedAmount,
            Unit = request.SeedUnit,
        });

        await planLock.CommitAsync();
        return Ok(new StockWithSeedResponse { Stock = stock, Seed = seed });
    }
}
