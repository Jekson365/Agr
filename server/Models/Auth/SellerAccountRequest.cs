using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

/// <summary>
/// Signing up from the marketplace. The same details the management software asks for, plus what
/// the shop trades under — the account it creates sells here and nothing more.
/// </summary>
public class SellerAccountRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    public string SellerName { get; set; } = string.Empty;

    public string SellerPhone { get; set; } = string.Empty;
}
