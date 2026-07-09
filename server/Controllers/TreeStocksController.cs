using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TreeStocksController(ITreeStockRepository treeStockRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreeStock>>> GetAll()
    {
        return Ok(await treeStockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TreeStock>> GetById(int id)
    {
        var stock = await treeStockRepository.GetByIdAsync(id);
        return stock is null ? NotFound() : Ok(stock);
    }

    [HttpPost]
    public async Task<ActionResult<TreeStock>> Create(TreeStock stock)
    {
        var created = await treeStockRepository.AddAsync(stock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TreeStock stock)
    {
        if (id != stock.Id)
        {
            return BadRequest();
        }

        var updated = await treeStockRepository.UpdateAsync(stock);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await treeStockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
