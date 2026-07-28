using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

public class GoogleAuthRequest
{
    /// <summary>The Google-issued ID token (JWT) obtained by the client via Google Sign-In.</summary>
    [Required]
    public string IdToken { get; set; } = string.Empty;
}
