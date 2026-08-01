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
    ITreeStockRepository treeStockRepository,
    IStockRepository stockRepository) : ControllerBase
{
    /// <summary>
    /// A plot is "this much of the land, growing that", so a fruit gets one plot per farmland —
    /// two plots of it would be two answers to how much of that land it takes up. Other land is
    /// free to grow the same fruit on a plot of its own.
    /// </summary>
    private const string TreeStockTakenMessage = "This land already has a plot of those trees.";

    /// <summary>The same rule as <see cref="TreeStockTakenMessage"/>, for a stock good.</summary>
    private const string StockTakenMessage = "This land already has a plot of that stock.";

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

    /// <summary>
    /// The stock goods already sown, so the plot form can offer only the rest — the
    /// <see cref="GetUsedTreeStocks"/> counterpart, scoped the same way.
    /// </summary>
    [HttpGet("used-stocks")]
    public async Task<ActionResult<IEnumerable<int>>> GetUsedStocks([FromQuery] int? farmId)
    {
        return Ok(await landPlotRepository.GetUsedStockIdsAsync(farmId));
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
        var problem = await SettleCropAsync(plot, plot.FarmId);
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
        // fruit or stock has to be free on — not whatever farm the request happens to name.
        var problem = await SettleCropAsync(plot, existing.FarmId, id);
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
    /// Checks the fruit or stock good the plot names and takes its crop from it, so the name shown
    /// on the plot can't drift from the entry it stands for. Returns the response to send back
    /// instead of saving, or null when the plot is good to save. Plots naming neither — recorded
    /// before a plot named what grew on it — are left as they are.
    /// </summary>
    private async Task<ActionResult?> SettleCropAsync(LandPlot plot, int farmId, int? excludeId = null)
    {
        plot.Crop = plot.Crop.Trim();

        // One plot grows one thing: the area it records answers for that entry alone, and a plot
        // claiming both would owe two answers. The clients only ever send one.
        if (plot.TreeStockId is not null && plot.StockId is not null)
        {
            return BadRequest("A plot grows either a fruit or a stock, not both.");
        }

        if (plot.TreeStockId is int treeStockId)
        {
            var treeStock = await treeStockRepository.GetByIdAsync(treeStockId);
            if (treeStock is null)
            {
                return BadRequest("That fruit no longer exists.");
            }

            if (await landPlotRepository.ExistsByTreeStockAsync(farmId, treeStockId, excludeId))
            {
                return Conflict(TreeStockTakenMessage);
            }

            plot.Crop = treeStock.Type.Trim();
            return null;
        }

        if (plot.StockId is int stockId)
        {
            var stock = await stockRepository.GetByIdAsync(stockId);
            if (stock is null)
            {
                return BadRequest("That stock no longer exists.");
            }

            if (await landPlotRepository.ExistsByStockAsync(farmId, stockId, excludeId))
            {
                return Conflict(StockTakenMessage);
            }

            plot.Crop = stock.Type.Trim();
            return null;
        }

        return null;
    }
}
