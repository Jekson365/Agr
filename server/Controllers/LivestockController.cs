using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LivestockController(
    ILivestockRepository livestockRepository,
    IAnimalProductionRepository animalProductionRepository,
    IPlanLimitService planLimitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Livestock>>> GetAll()
    {
        return Ok(await livestockRepository.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Livestock>> GetById(int id)
    {
        var livestock = await livestockRepository.GetByIdAsync(id);
        return livestock is null ? NotFound() : Ok(livestock);
    }

    [HttpPost]
    public async Task<ActionResult<Livestock>> Create(Livestock livestock)
    {
        if (await livestockRepository.ExistsByNameAsync(livestock.Name.Trim()))
        {
            return Conflict("A livestock group with this name already exists.");
        }

        try
        {
            var currentCount = (await livestockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureCanAddLivestockAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var created = await livestockRepository.AddAsync(livestock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Livestock livestock)
    {
        if (id != livestock.Id)
        {
            return BadRequest();
        }

        if (await livestockRepository.ExistsByNameAsync(livestock.Name.Trim(), id))
        {
            return Conflict("A livestock group with this name already exists.");
        }

        try
        {
            var currentCount = (await livestockRepository.GetAllAsync()).Count();
            await planLimitService.EnsureLivestockWithinLimitAsync(currentCount);
        }
        catch (InvalidOperationException ex)
        {
            return PlanLimitReached(ex.Message);
        }

        var updated = await livestockRepository.UpdateAsync(livestock);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>
    /// 402 is the plan-limit signal the clients watch for: it lets them answer with the list of
    /// available packets instead of just printing the message, which a plain 400 can't be told from
    /// an ordinary validation failure.
    /// </summary>
    private ObjectResult PlanLimitReached(string message) =>
        StatusCode(StatusCodes.Status402PaymentRequired, message);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Production records cascade with the group, which would erase that history from every
        // past report while any sales deducted from it survive — leaving balances negative with
        // no way to correct them. Refuse instead, so the records are removed deliberately.
        if (await animalProductionRepository.ExistsForLivestockAsync(id))
        {
            return Conflict("This group still has production records. Remove them first.");
        }

        var deleted = await livestockRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
