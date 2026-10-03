using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models.Auth;
using Server.Services;

namespace Server.Controllers;

public partial class AuthController
{
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await userRepository.GetByIdAsync(currentTenant.UserId);
        return user is null ? Unauthorized() : Ok(UserDto.From(user));
    }

    /// <summary>
    /// Takes today's sign-in bonus, if it is still there to take. Its own route rather than part of
    /// sign-in because a token lasts a week: someone who opens the app every day goes through
    /// <see cref="Login"/> about once, so hanging the daily bonus off that would pay it weekly. The
    /// client calls this whenever it starts with a session already in hand, and every call after
    /// the day's first is a cheap no-op.
    /// </summary>
    [Authorize]
    [HttpPost("daily-bonus")]
    public async Task<ActionResult<DailyBonusResponse>> ClaimDailyBonus()
    {
        var user = await userRepository.GetByIdAsync(currentTenant.UserId);
        if (user is null)
        {
            return Unauthorized();
        }

        var granted = await coinService.GrantDailyBonusAsync(user);

        return Ok(new DailyBonusResponse
        {
            Granted = granted,
            Amount = granted ? CoinService.DailyBonus : 0,
            User = UserDto.From(user),
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var existing = await userRepository.GetByIdAsync(currentTenant.UserId);
        var oldImagePath = existing?.ImagePath;
        var oldFarmImagePath = existing?.FarmImagePath;

        var user = await userRepository.UpdateProfileAsync(currentTenant.UserId, request);
        if (user is null)
        {
            return NotFound();
        }

        if (oldImagePath != request.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
        }

        if (request.FarmImagePath is not null && oldFarmImagePath != request.FarmImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldFarmImagePath);
        }

        return Ok(UserDto.From(user));
    }

    [Authorize]
    [HttpPut("profile/location")]
    public async Task<ActionResult<UserDto>> UpdateLocation(UpdateLocationRequest request)
    {
        var user = await userRepository.UpdateLocationAsync(currentTenant.UserId, request);
        return user is null ? NotFound() : Ok(UserDto.From(user));
    }

    [Authorize]
    [HttpPost("farm")]
    public async Task<IActionResult> CreateFarmDatabase()
    {
        var user = await userRepository.GetByIdAsync(currentTenant.UserId);
        if (user is null)
        {
            return NotFound();
        }

        if (!user.HasManagementAccess)
        {
            return Forbid();
        }

        await provisioningQueue.ProvisionAsync(user.Id);
        return NoContent();
    }

    [Authorize]
    [HttpPut("free-module")]
    public async Task<ActionResult<UserDto>> ChooseFreeModule(ChooseFreeModuleRequest request)
    {
        var user = await userRepository.ChooseFreeModuleAsync(currentTenant.UserId, request.Module);
        if (user is null)
        {
            return NotFound();
        }

        return user.FreeModule == request.Module
            ? Ok(UserDto.From(user))
            : Conflict("A free module has already been chosen for this account.");
    }

    [Authorize]
    [HttpPost("profile/upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            var imagePath = await fileStorageService.SaveImageAsync(file, "profile");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
