using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Models.Auth;

namespace Server.Controllers;

public partial class AuthController
{
    [AllowAnonymous]
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(GoogleAuthRequest request)
    {
        var clientId = configuration["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "Google sign-in is not configured.");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            // Verifies the token's signature against Google's public keys and checks that it was
            // issued for this app (audience) and has not expired.
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId],
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Invalid Google token.");
        }

        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
        {
            return Unauthorized("Google account email is not verified.");
        }

        var email = Normalize(payload.Email);
        var user = await userRepository.GetByEmailAsync(email);

        if (user is null)
        {
            // First Google sign-in for this email → register a new account (mirrors Register).
            // No password is set; the account authenticates through Google only.
            user = new User
            {
                Name = string.IsNullOrWhiteSpace(payload.Name) ? email : payload.Name.Trim(),
                Email = email,
                PasswordHash = string.Empty,
                Role = UserRole.Owner,
                IsSeller = true,
                SellerRegisteredAt = DateTime.UtcNow,
            };
            await userRepository.AddAsync(user);

            // Provision the new user's own database (farm_user_{id}) and apply its migrations.
            await tenantDatabaseProvisioner.ProvisionAsync(user.Id);
        }
        else
        {
            // Existing account (registered with a password or a previous Google sign-in): just
            // bring its database up to date, exactly like Login does.
            await tenantDatabaseProvisioner.ProvisionAsync(user.Id);
        }

        // Both branches are a first sign-in as far as the bonus is concerned — it pays once, and
        // the account that was just created above has never been paid.
        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

        return Ok(BuildResponse(user));
    }
}
