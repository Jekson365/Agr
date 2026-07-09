using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LandPlotsController(ILandPlotRepository landPlotRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LandPlot>>> GetByFarm([FromQuery] int farmId)
    {
        return Ok(await landPlotRepository.GetByFarmAsync(farmId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LandPlot>> GetById(int id)
    {
        var plot = await landPlotRepository.GetByIdAsync(id);
        return plot is null ? NotFound() : Ok(plot);
    }

    [HttpPost]
    public async Task<ActionResult<LandPlot>> Create(LandPlot plot)
    {
        var created = await landPlotRepository.AddAsync(plot);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, LandPlot plot)
    {
        if (id != plot.Id)
        {
            return BadRequest();
        }

        var updated = await landPlotRepository.UpdateAsync(plot);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await landPlotRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
