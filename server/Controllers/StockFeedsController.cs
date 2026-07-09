using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StockFeedsController(IStockFeedRepository stockFeedRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockFeed>>> GetByLivestock([FromQuery] int livestockId)
    {
        return Ok(await stockFeedRepository.GetByLivestockAsync(livestockId));
    }

    [HttpPost]
    public async Task<ActionResult<StockFeed>> Create(StockFeed feed)
    {
        var created = await stockFeedRepository.AddAsync(feed);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, StockFeed feed)
    {
        if (id != feed.Id)
        {
            return BadRequest();
        }

        var updated = await stockFeedRepository.UpdateAsync(feed);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await stockFeedRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
