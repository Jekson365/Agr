using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeSeedlingsController(
    ITreeSeedlingRepository treeSeedlingRepository,
    ITreeStockRepository treeStockRepository) : ControllerBase
{
    private const string PlantedOutMessage = "This batch is already planted out.";
    private const string PlantOutRouteMessage = "Use the plant-out endpoint to move a batch outside.";
    private const string KindMismatchMessage = "A batch may only be planted into an orchard growing the same fruit.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeSeedling>>> GetAll()
    {
        return Ok(await treeSeedlingRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TreeSeedling>> GetById(int id)
    {
        var seedling = await treeSeedlingRepository.GetByIdAsync(id);
        return seedling is null ? NotFound() : Ok(seedling);
    }

    [HttpPost]
    public async Task<ActionResult<TreeSeedling>> Create(TreeSeedling seedling)
    {
        if (string.IsNullOrWhiteSpace(seedling.Type))
        {
            return BadRequest("Type is required.");
        }
        if (seedling.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }
        if (seedling.Stage == NurseryStage.PlantedOut)
        {
            return BadRequest(PlantOutRouteMessage);
        }

        var created = await treeSeedlingRepository.AddAsync(seedling);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TreeSeedling seedling)
    {
        if (id != seedling.Id)
        {
            return BadRequest();
        }
        if (string.IsNullOrWhiteSpace(seedling.Type))
        {
            return BadRequest("Type is required.");
        }
        if (seedling.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        var existing = await treeSeedlingRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (existing.Stage == NurseryStage.PlantedOut)
        {
            return Conflict(PlantedOutMessage);
        }

        if (seedling.Stage == NurseryStage.PlantedOut)
        {
            return Conflict(PlantOutRouteMessage);
        }

        var updated = await treeSeedlingRepository.UpdateAsync(seedling);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await treeSeedlingRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/plant-out")]
    public async Task<ActionResult<TreeSeedling>> PlantOut(int id, TreeSeedlingPlantOutRequest request)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest("Quantity must be positive.");
        }

        var seedling = await treeSeedlingRepository.GetByIdAsync(id);
        if (seedling is null)
        {
            return NotFound();
        }

        if (seedling.Stage == NurseryStage.PlantedOut)
        {
            return Conflict(PlantedOutMessage);
        }

        if (request.Quantity > seedling.Quantity)
        {
            return Conflict($"This batch only raised {seedling.Quantity} seedlings.");
        }

        var stock = await treeStockRepository.GetByIdAsync(request.TreeStockId);
        if (stock is null)
        {
            return NotFound();
        }

        if (stock.IsDeleted)
        {
            return Conflict("That orchard was removed.");
        }

        if (!string.Equals(stock.Type.Trim(), seedling.Type.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(KindMismatchMessage);
        }

        var planted = await treeSeedlingRepository.PlantOutAsync(id, request);
        return planted is null ? NotFound() : Ok(planted);
    }
}
