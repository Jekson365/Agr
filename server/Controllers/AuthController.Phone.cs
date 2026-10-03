using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Server.Models;
using Server.Models.Auth;
using Server.Services;

namespace Server.Controllers;

public partial class AuthController
{
    private const string PhoneTaken = "An account with this phone number already exists.";

    [AllowAnonymous]
    [HttpPost("phone/register")]
    public async Task<ActionResult<AuthResponse>> RegisterByPhone(PhoneRegisterRequest request)
    {
        if (!PhoneNumbers.TryNormalize(request.PhoneNumber, out var phoneNumber))
        {
            return BadRequest("That does not look like a phone number.");
        }

        if (await userRepository.SignInPhoneExistsAsync(phoneNumber))
        {
            return Conflict(PhoneTaken);
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = string.Empty,
            PhoneNumber = phoneNumber,
            SignsInWithPhone = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
            IsSeller = true,
            SellerRegisteredAt = DateTime.UtcNow,
        };

        try
        {
            await userRepository.AddAsync(user);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Conflict(PhoneTaken);
        }

        provisioningQueue.StartNewFarm(user.Id);
        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    [AllowAnonymous]
    [HttpPost("phone/login")]
    public async Task<ActionResult<AuthResponse>> LoginByPhone(PhoneLoginRequest request)
    {
        PhoneNumbers.TryNormalize(request.PhoneNumber, out var phoneNumber);
        var user = await userRepository.GetBySignInPhoneAsync(phoneNumber);

        if (user is null
            || string.IsNullOrEmpty(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid phone number or password.");
        }

        if (user.HasManagementAccess)
        {
            await provisioningQueue.ProvisionAsync(user.Id);
        }

        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

        return Ok(BuildResponse(user));
    }
}
