using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseSeedsController(
    IGreenhouseSeedRepository greenhouseSeedRepository,
    IGreenhouseStockRepository greenhouseStockRepository,
    IGreenhouseRepository greenhouseRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseSeed>>> GetAll([FromQuery] int? greenhouseId)
    {
        return Ok(await greenhouseSeedRepository.GetAllAsync(greenhouseId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GreenhouseSeed>> GetById(int id)
    {
        var seed = await greenhouseSeedRepository.GetByIdAsync(id);
        return seed is null ? NotFound() : Ok(seed);
    }

    /// <summary>
    /// Seed is normally created with its stock (see GreenhouseStocksController.CreateWithSeed);
    /// this adds one on its own, for topping up what a greenhouse holds. Still counted against the
    /// same cap — otherwise this endpoint would be a way around it.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<GreenhouseSeed>> Create(GreenhouseSeed seed)
    {
        var invalid = await ValidateAsync(seed);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var limited = await EnsureUnderGreenhouseStockLimitAsync();
        if (limited is not null)
        {
            return BadRequest(limited);
        }

        seed.Type = seed.Type.Trim();
        seed.Name = seed.Name.Trim();
        var created = await greenhouseSeedRepository.AddAsync(seed);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseSeed seed)
    {
        if (id != seed.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(seed);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        seed.Type = seed.Type.Trim();
        seed.Name = seed.Name.Trim();
        var updated = await greenhouseSeedRepository.UpdateAsync(seed);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseSeedRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// The same cap GreenhouseStocksController checks, counting both greenhouse tables — kept in
    /// sync with that copy since both endpoints can add a "kind" toward the one allowance.
    /// </summary>
    private async Task<string?> EnsureUnderGreenhouseStockLimitAsync()
    {
        try
        {
            var currentCount = (await greenhouseStockRepository.GetAllAsync()).Count()
                + (await greenhouseSeedRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddStockAsync(currentCount);
            return null;
        }
        catch (InvalidOperationException ex)
        {
            return ex.Message;
        }
    }

    /// <summary>Shared checks for creating or editing. Returns the problem, or null when valid.</summary>
    private async Task<string?> ValidateAsync(GreenhouseSeed seed)
    {
        if (string.IsNullOrWhiteSpace(seed.Type))
        {
            return "A seed needs a crop type.";
        }
        if (seed.Amount < 0)
        {
            return "Amount cannot be negative.";
        }
        if (!Enum.IsDefined(seed.Unit))
        {
            return "Unknown unit.";
        }
        if (await greenhouseRepository.GetByIdAsync(seed.GreenhouseId) is null)
        {
            return "That greenhouse does not exist.";
        }
        return null;
    }
}
