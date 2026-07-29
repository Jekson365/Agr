using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LandPlotsController(
    ILandPlotRepository landPlotRepository,
    ITreeStockRepository treeStockRepository) : ControllerBase
{
    /// <summary>
    /// A plot is "this much of the land, growing that", so a fruit gets one plot per farmland —
    /// two plots of it would be two answers to how much of that land it takes up. Other land is
    /// free to grow the same fruit on a plot of its own.
    /// </summary>
    private const string TreeStockTakenMessage = "This land already has a plot of those trees.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LandPlot>>> GetByFarm([FromQuery] int farmId)
    {
        return Ok(await landPlotRepository.GetByFarmAsync(farmId));
    }

    /// <summary>
    /// The tree stock entries already planted, so the plot form can offer only the rest. Scoped to
    /// one farmland when <paramref name="farmId"/> is given — that's the scope the rule is written
    /// in — and to every land when it isn't, which is what tells whether a fruit is planted at all.
    /// </summary>
    [HttpGet("used-tree-stocks")]
    public async Task<ActionResult<IEnumerable<int>>> GetUsedTreeStocks([FromQuery] int? farmId)
    {
        return Ok(await landPlotRepository.GetUsedTreeStockIdsAsync(farmId));
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
        var problem = await SettleTreeStockAsync(plot, plot.FarmId);
        if (problem is not null)
        {
            return problem;
        }

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

        var existing = await landPlotRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        // The land a plot sits on is fixed once created, so the row's own farm is the land the
        // fruit has to be free on — not whatever farm the request happens to name.
        var problem = await SettleTreeStockAsync(plot, existing.FarmId, id);
        if (problem is not null)
        {
            return problem;
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

    /// <summary>
    /// Checks the fruit the plot names and takes its crop from it, so the name shown on the plot
    /// can't drift from the stock it stands for. Returns the response to send back instead of
    /// saving, or null when the plot is good to save. Plots naming no stock — recorded before the
    /// two were paired — are left as they are.
    /// </summary>
    private async Task<ActionResult?> SettleTreeStockAsync(LandPlot plot, int farmId, int? excludeId = null)
    {
        plot.Crop = plot.Crop.Trim();

        if (plot.TreeStockId is not int treeStockId)
        {
            return null;
        }

        var stock = await treeStockRepository.GetByIdAsync(treeStockId);
        if (stock is null)
        {
            return BadRequest("That fruit no longer exists.");
        }

        if (await landPlotRepository.ExistsByTreeStockAsync(farmId, treeStockId, excludeId))
        {
            return Conflict(TreeStockTakenMessage);
        }

        plot.Crop = stock.Type.Trim();
        return null;
    }
}
