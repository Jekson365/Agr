using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FruitKindsController(IFruitKindRepository fruitKindRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FruitKind>>> GetAll()
    {
        return Ok(await fruitKindRepository.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<FruitKind>> Create(FruitKind kind)
    {
        var name = kind.Name.Trim();
        if (string.IsNullOrEmpty(name))
        {
            return BadRequest();
        }

        return Ok(await fruitKindRepository.AddAsync(name));
    }
}
