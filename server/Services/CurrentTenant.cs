using System.Security.Claims;
using Server.Services.Interfaces;

namespace Server.Services;

public class CurrentTenant(IHttpContextAccessor accessor) : ICurrentTenant
{
    public int UserId
    {
        get
        {
            var value = accessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : 0;
        }
    }

    public string? Name => accessor.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;
}
