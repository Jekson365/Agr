using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeProductsController(
    ITreeProductRepository treeProductRepository,
    IHarvestProductRepository harvestProductRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeProduct>>> GetAll()
    {
        return Ok(await treeProductRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TreeProduct>> GetById(int id)
    {
        var product = await treeProductRepository.GetByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<TreeProduct>> Create(TreeProduct product)
    {
        if (string.IsNullOrWhiteSpace(product.Name))
        {
            return BadRequest("A product needs a name.");
        }

        var created = await treeProductRepository.AddAsync(product);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TreeProduct product)
    {
        if (id != product.Id)
        {
            return BadRequest();
        }

        var updated = await treeProductRepository.UpdateAsync(product);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // A harvest still recording this product would be orphaned — refuse rather than 500.
        if (await harvestProductRepository.ExistsForProductAsync(id))
        {
            return Conflict("A harvest still records produce for this product.");
        }

        var deleted = await treeProductRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
