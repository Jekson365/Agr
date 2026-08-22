using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public partial class PurchasesController(
    AppDbContext context,
    IPurchaseRepository purchaseRepository,
    ILivestockRepository livestockRepository,
    ILivestockMovementRepository livestockMovementRepository,
    ILivestockDetailRepository livestockDetailRepository,
    IProductionTypeRepository productionTypeRepository,
    IUnitRepository unitRepository,
    IProductionMovementRepository productionMovementRepository,
    ITreeStockRepository treeStockRepository,
    ITreeStockMovementRepository treeStockMovementRepository,
    ITreeProductRepository treeProductRepository,
    ITreeProductMovementRepository treeProductMovementRepository,
    IStockRepository stockRepository,
    IStockMovementRepository stockMovementRepository,
    ISeedRepository seedRepository,
    ISeedMovementRepository seedMovementRepository,
    IEquipmentRepository equipmentRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseDocumentDto>>> GetAll()
    {
        return Ok(await purchaseRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseDocumentDto>> GetById(int id)
    {
        var document = await purchaseRepository.GetByIdAsync(id);
        return document is null ? NotFound() : Ok(document);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseDocumentDto>> Create(CreatePurchaseRequest request)
    {
        var (resolved, failure) = await ReadRequestAsync(request);
        if (failure is not null)
        {
            return failure;
        }

        // One transaction over the whole document: every line moves a balance, and a document that
        // applied only some of them would leave the ledgers saying something that never happened.
        await using var transaction = await context.Database.BeginTransactionAsync();

        var document = await purchaseRepository.AddDocumentAsync(new PurchaseDocument
        {
            Seller = request.Seller.Trim(),
            Date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
        });

        await ApplyAllAsync(resolved!, document);
        await transaction.CommitAsync();

        return CreatedAtAction(nameof(GetById), new { id = document.Id }, await purchaseRepository.GetByIdAsync(document.Id));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var document = await purchaseRepository.GetDocumentAsync(id);
        if (document is null)
        {
            return NotFound();
        }

        var items = await purchaseRepository.GetItemsAsync(id);
        if (await FirstRevertBlockerAsync(items) is string blocked)
        {
            return Conflict(blocked);
        }

        await using var transaction = await context.Database.BeginTransactionAsync();

        foreach (var item in items)
        {
            await RevertAsync(item);
        }
        await purchaseRepository.DeleteAsync(id);

        await transaction.CommitAsync();
        return NoContent();
    }
}
