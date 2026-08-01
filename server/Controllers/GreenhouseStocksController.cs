using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GreenhouseStocksController(
    IGreenhouseStockRepository greenhouseStockRepository,
    IGreenhouseSeedRepository greenhouseSeedRepository,
    IGreenhouseRepository greenhouseRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    private const string NameTakenMessage = "Greenhouse stock with this name already exists.";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GreenhouseStock>>> GetAll([FromQuery] int? greenhouseId)
    {
        return Ok(await greenhouseStockRepository.GetAllAsync(greenhouseId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GreenhouseStock>> GetById(int id)
    {
        var stock = await greenhouseStockRepository.GetByIdAsync(id);
        return stock is null ? NotFound() : Ok(stock);
    }

    /// <summary>
    /// Creates greenhouse stock and the seed for the same crop in one call. This is how greenhouse
    /// stock is added: the seed isn't optional, so making both here removes the window in which a
    /// client could create one without the other.
    /// </summary>
    [HttpPost("with-seed")]
    public async Task<ActionResult<GreenhouseStockWithSeedResponse>> CreateWithSeed(GreenhouseStockWithSeedRequest request)
    {
        var invalid = await ValidateAsync(request.GreenhouseId, request.Type, request.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }
        if (request.SeedAmount < 0)
        {
            return BadRequest("Seed amount cannot be negative.");
        }
        if (!Enum.IsDefined(request.Unit) || !Enum.IsDefined(request.SeedUnit))
        {
            return BadRequest("Unknown unit.");
        }

        var name = request.Name.Trim();
        if (await NameTakenAsync(name))
        {
            return Conflict(NameTakenMessage);
        }

        var limited = await EnsureUnderGreenhouseStockLimitAsync();
        if (limited is not null)
        {
            return BadRequest(limited);
        }

        var type = request.Type.Trim();

        var stock = await greenhouseStockRepository.AddAsync(new GreenhouseStock
        {
            GreenhouseId = request.GreenhouseId,
            Type = type,
            Name = name,
            Amount = request.Amount,
            Unit = request.Unit,
        });

        // Same crop, same label and the same greenhouse, so the seed and the produce it grows into
        // read identically wherever they're listed.
        var seed = await greenhouseSeedRepository.AddAsync(new GreenhouseSeed
        {
            GreenhouseId = request.GreenhouseId,
            Type = type,
            Name = name,
            Amount = request.SeedAmount,
            Unit = request.SeedUnit,
        });

        return Ok(new GreenhouseStockWithSeedResponse { Stock = stock, Seed = seed });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, GreenhouseStock stock)
    {
        if (id != stock.Id)
        {
            return BadRequest();
        }

        var invalid = await ValidateAsync(stock.GreenhouseId, stock.Type, stock.Amount);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }
        if (!Enum.IsDefined(stock.Unit))
        {
            return BadRequest("Unknown unit.");
        }

        stock.Type = stock.Type.Trim();
        stock.Name = stock.Name.Trim();

        if (await NameTakenAsync(stock.Name, id))
        {
            return Conflict(NameTakenMessage);
        }

        var updated = await greenhouseStockRepository.UpdateAsync(stock);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// Whether another row already carries this label. The label is what tells apart goods of the
    /// same crop, so two identical ones would be indistinguishable everywhere they're listed —
    /// which greenhouse each sits in doesn't enter into it, since the page lists them all together.
    /// A blank name is not a label at all: those rows show their crop's name instead, so any number
    /// of them may coexist.
    /// </summary>
    private async Task<bool> NameTakenAsync(string name, int? excludeId = null)
    {
        return name.Length > 0 && await greenhouseStockRepository.ExistsByNameAsync(name, excludeId);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await greenhouseStockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// The plan's cap on kinds of stock, scoped to the greenhouse tables only — field stock has
    /// its own count and its own cap, entirely independent of this one. Counts both greenhouse
    /// stock and greenhouse seed, since either endpoint can add a "kind" and neither should be
    /// able to grow past the cap the other is held to.
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
    private async Task<string?> ValidateAsync(int greenhouseId, string type, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return "A stock needs a type.";
        }
        if (amount < 0)
        {
            return "Amount cannot be negative.";
        }
        // The greenhouse is what the stock sits in, so an unknown one would orphan it.
        if (await greenhouseRepository.GetByIdAsync(greenhouseId) is null)
        {
            return "That greenhouse does not exist.";
        }
        return null;
    }
}
