using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

/// <summary>
/// What a seller shows buyers. Every field is sent every time — the form holds them all, so an
/// omitted one is a cleared one rather than an untouched one.
/// </summary>
public class SellerProfileRequest
{
    [Required]
    [MinLength(2)]
    public string SellerName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;
    public string SellerTelegram { get; set; } = string.Empty;
    public string SellerWhatsapp { get; set; } = string.Empty;
    public string SellerFacebook { get; set; } = string.Empty;
    public string SellerLocation { get; set; } = string.Empty;
}
