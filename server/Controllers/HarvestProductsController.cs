using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HarvestProductsController(IHarvestProductRepository harvestProductRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestProduct>>> Get([FromQuery] int? harvestId)
    {
        return Ok(await harvestProductRepository.GetAsync(harvestId));
    }

    [HttpPost]
    public async Task<ActionResult<HarvestProduct>> Create(HarvestProduct harvestProduct)
    {
        if (harvestProduct.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        return Ok(await harvestProductRepository.AddAsync(harvestProduct));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, HarvestProduct harvestProduct)
    {
        if (id != harvestProduct.Id)
        {
            return BadRequest();
        }
        if (harvestProduct.Amount <= 0)
        {
            return BadRequest("Amount must be positive.");
        }

        var updated = await harvestProductRepository.UpdateAsync(harvestProduct);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await harvestProductRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
