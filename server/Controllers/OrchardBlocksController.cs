using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrchardBlocksController(
    IOrchardBlockRepository orchardBlockRepository,
    ITreeStockRepository treeStockRepository) : ControllerBase
{
    /// <summary>
    /// An orchard is planted once: where its trees stand is one answer, so a second block for the
    /// same orchard would be a second answer. Change the first one instead.
    /// </summary>
    private const string AlreadyPlacedMessage = "This orchard already has a planted area.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrchardBlock>>> GetAll()
    {
        return Ok(await orchardBlockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrchardBlock>> GetById(int id)
    {
        var block = await orchardBlockRepository.GetByIdAsync(id);
        return block is null ? NotFound() : Ok(block);
    }

    [HttpPost]
    public async Task<ActionResult<OrchardBlock>> Create(OrchardBlock block)
    {
        var invalid = Validate(block);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var stock = await treeStockRepository.GetByIdAsync(block.TreeStockId);
        if (stock is null)
        {
            return NotFound();
        }
        if (stock.IsDeleted)
        {
            return Conflict("That orchard was removed.");
        }

        if (await orchardBlockRepository.GetByTreeStockAsync(block.TreeStockId) is not null)
        {
            return Conflict(AlreadyPlacedMessage);
        }

        var created = await orchardBlockRepository.AddAsync(block);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, OrchardBlock block)
    {
        if (id != block.Id)
        {
            return BadRequest();
        }

        var invalid = Validate(block);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var updated = await orchardBlockRepository.UpdateAsync(block);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await orchardBlockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    private static string? Validate(OrchardBlock block)
    {
        if (string.IsNullOrWhiteSpace(block.Boundary))
        {
            return "An outline is required.";
        }
        if (block.TreeSpacing <= 0)
        {
            return "Tree spacing must be positive.";
        }
        if (block.RowSpacing <= 0)
        {
            return "Row spacing must be positive.";
        }
        if (block.TreeCount < 0)
        {
            return "A tree count cannot be negative.";
        }
        return null;
    }
}
