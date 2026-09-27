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
public partial class AuthController(
    IUserRepository userRepository,
    ITokenService tokenService,
    ITenantDatabaseProvisioner tenantDatabaseProvisioner,
    ICurrentTenant currentTenant,
    IFileStorageService fileStorageService,
    ICoinService coinService,
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
        // A farm can sell what it produces, so signing up here carries the marketplace with it —
        // only the reverse direction needs granting (see User.IsSeller).
        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
            IsSeller = true,
            SellerRegisteredAt = DateTime.UtcNow,
        };
        await userRepository.AddAsync(user);

        // ...then provision that user's own database (farm_user_{id}) and apply its migrations.
        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);

        // Registering is the first way into the system, so the joining bonus is paid here rather
        // than waiting for a separate sign-in that never comes. Signing up is also an arrival, so
        // day one's daily bonus goes with it.
        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    /// <summary>
    /// Signing up from the marketplace. Same table, same login, same everything the management
    /// software's own registration writes — except the account arrives as a seller and without
    /// management access, so it lists and orders here and cannot open the farm software.
    ///
    /// No tenant database is provisioned: a shop has no farm to record. Granting management access
    /// later is enough on its own, because the next login provisions the database it then needs.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register-seller")]
    public async Task<ActionResult<AuthResponse>> RegisterSeller(SellerAccountRequest request)
    {
        var email = Normalize(request.Email);

        if (await userRepository.EmailExistsAsync(email))
        {
            return Conflict("An account with this email already exists.");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Owner,
            HasManagementAccess = false,
            IsSeller = true,
            SellerName = request.SellerName.Trim(),
            SellerPhone = request.SellerPhone?.Trim() ?? string.Empty,
            SellerRegisteredAt = DateTime.UtcNow,
        };
        await userRepository.AddAsync(user);

        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

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
        // Skipped for an account that cannot open the management software: it has nothing to keep
        // in there, and the database it would get is one per shop that nothing ever reads. Granting
        // access later needs no extra step — the login after it provisions.
        if (user.HasManagementAccess)
        {
            await tenantDatabaseProvisioner.ProvisionAsync(user.Id);
        }

        // Only pays anyone who has never been paid — an account from before the coin system gets
        // its joining bonus on this sign-in, and no one gets it twice. The daily bonus is the
        // opposite: it is meant to come round again, and pays if today's is still going.
        await coinService.GrantWelcomeBonusAsync(user);
        await coinService.GrantDailyBonusAsync(user);

        return Ok(BuildResponse(user));
    }

    private AuthResponse BuildResponse(User user) => new()
    {
        Token = tokenService.CreateToken(user),
        User = UserDto.From(user),
    };

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
