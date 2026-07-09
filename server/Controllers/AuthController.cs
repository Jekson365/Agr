using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Models.Auth;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    IUserRepository userRepository,
    ITokenService tokenService,
    ITenantDatabaseProvisioner tenantDatabaseProvisioner,
    ICurrentTenant currentTenant,
    IFileStorageService fileStorageService) : ControllerBase
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

        return Ok(BuildResponse(user));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(Normalize(request.Email));

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        // Bring the user's database up to date on every login. This is idempotent — it creates
        // the database if it is somehow missing and applies any migrations added since last time.
        await tenantDatabaseProvisioner.ProvisionAsync(user.Id);

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
        var user = await userRepository.UpdateProfileAsync(currentTenant.UserId, request);
        return user is null ? NotFound() : Ok(UserDto.From(user));
    }

    [Authorize]
    [HttpPost("profile/upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
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
