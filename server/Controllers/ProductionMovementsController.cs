using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductionMovementsController(
    IProductionMovementRepository productionMovementRepository,
    IMarketListingRepository marketListingRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionMovement>>> GetAll()
    {
        return Ok(await productionMovementRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<ProductionMovement>> Create(ProductionAdjustmentRequest request)
    {
        if (request.Delta == 0)
        {
            return BadRequest("Delta must be non-zero.");
        }

        var available = await productionMovementRepository.GetBalanceAsync(request.ProductionTypeId, request.UnitId);
        if (available + request.Delta < 0)
        {
            return Conflict($"Only {available} of this product is available.");
        }

        var created = await productionMovementRepository.AddAsync(new ProductionMovement
        {
            ProductionTypeId = request.ProductionTypeId,
            UnitId = request.UnitId,
            Delta = request.Delta,
            Source = ProductionMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date,
        });
        return Ok(created);
    }

    /// <summary>Records a marketplace sale of livestock production: logs a movement with a
    /// negative delta tagged <see cref="ProductionMovementSource.Market"/> against the
    /// type/unit balance, mirroring the stock sale endpoint.</summary>
    [HttpPost("sale")]
    public async Task<ActionResult<ProductionMovement>> RecordSale(ProductionSaleRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        // The client checks this too, but two sales recorded at once would both pass that check
        // and overdraw the balance; the ledger is only meaningful if it can't go negative.
        var available = await productionMovementRepository.GetBalanceAsync(request.ProductionTypeId, request.UnitId);
        if (request.Quantity > available)
        {
            return Conflict($"Only {available} of this product is available.");
        }

        var movement = new ProductionMovement
        {
            ProductionTypeId = request.ProductionTypeId,
            UnitId = request.UnitId,
            MarketListingId = request.MarketListingId,
            Delta = -request.Quantity,
            Source = ProductionMovementSource.Market,
        };
        return Ok(await productionMovementRepository.AddAsync(movement));
    }

    /// <summary>Rolls a recorded sale back completely: the quantity returns to the product's
    /// balance and the listing it was sold from goes back to how it was, so nothing is left
    /// saying the sale happened.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await productionMovementRepository.DeleteAsync(id);
        if (removed is null)
        {
            return NotFound();
        }

        if (removed.MarketListingId is not null)
        {
            // A listing that was since edited or deleted just stays as it is — the balance is
            // already corrected, and failing here would leave the caller unable to retry.
            await marketListingRepository.RestoreAfterSaleAsync(removed.MarketListingId.Value, -removed.Delta);
        }

        return NoContent();
    }
}
