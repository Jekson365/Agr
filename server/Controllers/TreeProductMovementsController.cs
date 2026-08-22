using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeProductMovementsController(ITreeProductMovementRepository treeProductMovementRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeProductMovementDto>>> Get([FromQuery] int? treeProductId)
    {
        return Ok(await treeProductMovementRepository.GetAsync(treeProductId));
    }

    /// <summary>Records a manual adjustment to a product's balance — positive to add, negative to
    /// draw down (e.g. produce sold or spoiled).</summary>
    [HttpPost]
    public async Task<ActionResult<TreeProductMovement>> Create(TreeProductAdjustmentRequest request)
    {
        if (request.Delta == 0)
        {
            return BadRequest("Delta must be non-zero.");
        }

        var available = await treeProductMovementRepository.GetBalanceAsync(request.TreeProductId);
        if (available + request.Delta < 0)
        {
            return Conflict($"Only {available} of this product is available.");
        }

        var created = await treeProductMovementRepository.AddAsync(new TreeProductMovement
        {
            TreeProductId = request.TreeProductId,
            Delta = request.Delta,
            Source = TreeProductMovementSource.Manual,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Date = request.Date,
        });
        return Ok(created);
    }

    /// <summary>Records a sale: a negative movement drawing the product's balance down. Refuses
    /// to sell more than is on hand, so the ledger can't go negative.</summary>
    [HttpPost("sale")]
    public async Task<ActionResult<TreeProductMovement>> RecordSale(TreeProductSaleRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        var available = await treeProductMovementRepository.GetBalanceAsync(request.TreeProductId);
        if (request.Quantity > available)
        {
            return Conflict($"Only {available} of this product is available.");
        }

        var created = await treeProductMovementRepository.AddAsync(new TreeProductMovement
        {
            TreeProductId = request.TreeProductId,
            Delta = -request.Quantity,
            Source = TreeProductMovementSource.Market,
        });
        return Ok(created);
    }
}
