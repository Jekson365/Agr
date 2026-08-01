using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

/// <summary>
/// The caller's neighbourhood: who they farm alongside, who has asked to, and who they might ask.
/// Every route is addressed by the *other* user's id — the caller's own side always comes from
/// their token, never from the request.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NeighboursController(
    INeighbourRepository neighbourRepository,
    INeighbourTerritoryService neighbourTerritoryService,
    ICurrentTenant currentTenant) : ControllerBase
{
    /// <summary>A search term shorter than this matches most of the user table without telling
    /// the searcher anything useful, so it is refused.</summary>
    private const int MinimumSearchLength = 2;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NeighbourDto>>> GetNeighbours()
    {
        return Ok(await neighbourRepository.GetNeighboursAsync(currentTenant.UserId));
    }

    [HttpGet("requests")]
    public async Task<ActionResult<IEnumerable<NeighbourDto>>> GetRequests()
    {
        return Ok(await neighbourRepository.GetRequestsAsync(currentTenant.UserId));
    }

    /// <summary>
    /// The farms anyone has outlined within reach of the caller's own land — neighbours and
    /// strangers alike, each carrying how far off it is.
    /// </summary>
    [HttpGet("territories")]
    public async Task<ActionResult<IEnumerable<NeighbourTerritoryDto>>> GetTerritories()
    {
        return Ok(await neighbourTerritoryService.GetForUserAsync(currentTenant.UserId));
    }

    /// <summary>One of those territories in full, fetched when a user picks it out on the map.</summary>
    [HttpGet("territories/{ownerId:int}/{farmId:int}")]
    public async Task<ActionResult<TerritoryDetailsDto>> GetTerritoryDetails(int ownerId, int farmId)
    {
        var details = await neighbourTerritoryService.GetDetailsAsync(currentTenant.UserId, ownerId, farmId);
        return details is null ? NotFound() : Ok(details);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<NeighbourDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < MinimumSearchLength)
        {
            return Ok(Array.Empty<NeighbourDto>());
        }

        return Ok(await neighbourRepository.SearchAsync(currentTenant.UserId, q));
    }

    /// <summary>Named for what it does rather than plain "Request", which would hide
    /// <see cref="ControllerBase.Request"/> — the HTTP request itself.</summary>
    [HttpPost("{userId:int}")]
    public async Task<ActionResult<NeighbourDto>> SendRequest(int userId)
    {
        if (userId == currentTenant.UserId)
        {
            return BadRequest("You cannot add yourself as a neighbour.");
        }

        var result = await neighbourRepository.RequestAsync(currentTenant.UserId, userId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{userId:int}/accept")]
    public async Task<ActionResult<NeighbourDto>> Accept(int userId)
    {
        var result = await neighbourRepository.AcceptAsync(currentTenant.UserId, userId);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Removes a neighbour, declines a request, or cancels one the caller sent — from
    /// either side, the link simply goes.</summary>
    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> Remove(int userId)
    {
        var removed = await neighbourRepository.RemoveAsync(currentTenant.UserId, userId);
        return removed ? NoContent() : NotFound();
    }
}
