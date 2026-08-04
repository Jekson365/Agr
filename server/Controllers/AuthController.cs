using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Models.Auth;
using Server.Repositories.Interfaces;
using Server.Services;
using Server.Services.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    IUserRepository userRepository,
    ITokenService tokenService,
    ITenantDatabaseProvisioner tenantDatabaseProvisioner,
    ICurrentTenant currentTenant,
    IFileStorageService fileStorageService,
    ICoinService coinService,
    // TEMPORARILY DISABLED with the phone routes below — unread while they are commented out.
    // IPhoneVerificationService phoneVerification,
    IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = Normalize(request.Email);

        if (await userRepository.EmailExistsAsync(email))
        {
            return Conflict("An account with this email already exists.");
        }

        // Create the user row in the master database first so it receives its identity id...
        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
        };
        await userRepository.AddAsync(user);

        // ...then provision that user's own database (farm_user_{id}) and apply its migrations.
        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);

        // Registering is the first way into the system, so the joining bonus is paid here rather
        // than waiting for a separate sign-in that never comes.
        await coinService.GrantWelcomeBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(Normalize(request.Email));

        // An empty PasswordHash means the account was created via Google sign-in and has no
        // password — reject before BCrypt.Verify (which would throw on an empty hash).
        if (user is null
            || string.IsNullOrEmpty(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        // Bring the user's database up to date on every login. This is idempotent — it creates
        // the database if it is somehow missing and applies any migrations added since last time.
        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);

        // Only pays anyone who has never been paid — an account from before the coin system gets
        // its joining bonus on this sign-in, and no one gets it twice.
        await coinService.GrantWelcomeBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    // ------------------------------------------------------------------------------------------
    // TEMPORARILY DISABLED: sign-in and registration by phone number.
    //
    // The three routes below (phone/send-code, phone/register, phone/login) are commented out
    // together — they are one flow, and leaving send-code reachable on its own would text codes
    // that nothing could then redeem. With them gone the API answers 404 for all three, which is
    // what actually enforces the block; the client's method toggle is hidden to match
    // (web/src/pages/auth/login-page.tsx).
    //
    // Nothing else was removed: the services, DTOs, SMS integration and the PhoneNumber columns
    // all remain. To restore, delete the /* below and the matching */ after LoginByPhone.
    // ------------------------------------------------------------------------------------------
    /*
    /// <summary>
    /// Texts a one-time code to a number that is about to be registered. Asking again for a number
    /// that already has an account is refused here rather than after the code has been paid for and
    /// typed in.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("phone/send-code")]
    public async Task<IActionResult> SendPhoneCode(SendPhoneCodeRequest request)
    {
        if (!PhoneNumbers.TryNormalize(request.PhoneNumber, out var phoneNumber))
        {
            return BadRequest("That does not look like a phone number.");
        }

        if (await userRepository.VerifiedPhoneExistsAsync(phoneNumber))
        {
            return Conflict("An account with this phone number already exists.");
        }

        var result = await phoneVerification.SendAsync(phoneNumber);

        return result.Status switch
        {
            SendCodeStatus.Sent => Ok(new
            {
                resendAfterSeconds = result.RetryAfterSeconds,
                expiresInSeconds = result.ExpiresInSeconds,
            }),

            // 429 both ways: the client shows the wait, and the two are told apart by the number of
            // seconds rather than by a code of their own.
            SendCodeStatus.TooSoon or SendCodeStatus.TooMany => StatusCode(
                StatusCodes.Status429TooManyRequests,
                new { retryAfterSeconds = result.RetryAfterSeconds }),

            // The account is fine, the provider is not — nothing the visitor can fix by retrying now.
            _ => StatusCode(StatusCodes.Status502BadGateway, "Could not send the code. Please try again shortly."),
        };
    }

    /// <summary>
    /// Registers against a number proved by the code just texted to it. Everything after the check
    /// is what <see cref="Register"/> does — same tenant database, same joining bonus.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("phone/register")]
    public async Task<ActionResult<AuthResponse>> RegisterByPhone(PhoneRegisterRequest request)
    {
        if (!PhoneNumbers.TryNormalize(request.PhoneNumber, out var phoneNumber))
        {
            return BadRequest("That does not look like a phone number.");
        }

        if (await userRepository.VerifiedPhoneExistsAsync(phoneNumber))
        {
            return Conflict("An account with this phone number already exists.");
        }

        // Spends the code. It proves the number, and it proves it once — a second registration
        // needs a second code.
        if (!await phoneVerification.TryConsumeAsync(phoneNumber, request.Code.Trim()))
        {
            return Unauthorized("That code is wrong or has expired.");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            // No email: this account is reached by its number. The unique index on Email is
            // filtered to non-empty values so that every one of these can hold the empty string.
            Email = string.Empty,
            PhoneNumber = phoneNumber,
            PhoneVerifiedAt = DateTime.UtcNow,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
        };
        await userRepository.AddAsync(user);

        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);
        await coinService.GrantWelcomeBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    /// <summary>Signs in with a verified number and the account's password.</summary>
    [AllowAnonymous]
    [HttpPost("phone/login")]
    public async Task<ActionResult<AuthResponse>> LoginByPhone(PhoneLoginRequest request)
    {
        // Deliberately the same answer for a number nobody holds, a number that was never verified
        // and a wrong password — which of the three it was is not a visitor's business.
        PhoneNumbers.TryNormalize(request.PhoneNumber, out var phoneNumber);
        var user = await userRepository.GetByVerifiedPhoneAsync(phoneNumber);

        if (user is null
            || string.IsNullOrEmpty(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid phone number or password.");
        }

        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);
        await coinService.GrantWelcomeBonusAsync(user);

        return Ok(BuildResponse(user));
    }
    */
    // ---------------------- end of temporarily disabled phone auth ----------------------------

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

        return Ok(BuildResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await userRepository.GetByIdAsync(currentTenant.UserId);
        return user is null ? Unauthorized() : Ok(UserDto.From(user));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var existing = await userRepository.GetByIdAsync(currentTenant.UserId);
        var oldImagePath = existing?.ImagePath;

        var user = await userRepository.UpdateProfileAsync(currentTenant.UserId, request);
        if (user is null)
        {
            return NotFound();
        }

        if (oldImagePath != request.ImagePath)
        {
            await fileStorageService.DeleteImageAsync(oldImagePath);
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

    private AuthResponse BuildResponse(User user) => new()
    {
        Token = tokenService.CreateToken(user),
        User = UserDto.From(user),
    };

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
