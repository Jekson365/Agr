using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestsController(IHarvestRepository harvestRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Harvest>>> GetAll([FromQuery] HarvestKind? kind)
    {
        return Ok(await harvestRepository.GetAllAsync(kind));
    }

    /// <summary>
    /// The plant stocks some harvest records — planned or picked, across every harvest. A harvest
    /// is written in the good's own terms, so this is what tells the stock form which rows may no
    /// longer change their kind or their unit.
    /// </summary>
    [HttpGet("recorded-stocks")]
    public async Task<ActionResult<IEnumerable<int>>> GetRecordedStocks()
    {
        return Ok(await harvestRepository.GetRecordedStockIdsAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Harvest>> GetById(int id)
    {
        var harvest = await harvestRepository.GetByIdAsync(id);
        return harvest is null ? NotFound() : Ok(harvest);
    }

    [HttpPost]
    public async Task<ActionResult<Harvest>> Create(Harvest harvest)
    {
        var created = await harvestRepository.AddAsync(harvest);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Harvest harvest)
    {
        if (id != harvest.Id)
        {
            return BadRequest();
        }

        var updated = await harvestRepository.UpdateAsync(harvest);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
