using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models.Auth;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

/// <summary>
/// Registering the signed-in account as a marketplace seller.
///
/// There is no separate seller account: this marks the user row the caller already signed in with,
/// so one login both sells and buys. Registering adds a capability and removes none — a seller
/// orders from other sellers exactly as they did before.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SellersController(IUserRepository userRepository, ICurrentTenant currentTenant) : ControllerBase
{
    /// <summary>What the caller trades as, or that they are not registered yet.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await userRepository.GetByIdAsync(currentTenant.UserId);
        return user is null ? NotFound() : Ok(UserDto.From(user));
    }

    /// <summary>
    /// Registers the caller as a seller, or updates what they trade under if they already are.
    /// Idempotent by design — the form that opens it is the same form either way, and the date
    /// they first registered is kept rather than moved.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(SellerRegistrationRequest request)
    {
        var sellerName = request.SellerName?.Trim() ?? string.Empty;
        if (sellerName.Length < 2)
        {
            return BadRequest("A seller needs a name.");
        }

        var updated = await userRepository.RegisterSellerAsync(
            currentTenant.UserId, sellerName, request.SellerPhone?.Trim() ?? string.Empty);

        return updated is null ? NotFound() : Ok(UserDto.From(updated));
    }

    /// <summary>
    /// Rewrites what buyers see: who the seller is, where they trade from, and every way to reach
    /// them. Only a registered seller has a profile, so an account that never registered gets a
    /// 404 rather than a silently created one.
    /// </summary>
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(SellerProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SellerName) || request.SellerName.Trim().Length < 2)
        {
            return BadRequest("A seller needs a name.");
        }

        var updated = await userRepository.UpdateSellerProfileAsync(currentTenant.UserId, request);
        return updated is null ? NotFound() : Ok(UserDto.From(updated));
    }
}
