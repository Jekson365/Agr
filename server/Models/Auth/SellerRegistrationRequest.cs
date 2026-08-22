using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

public class SellerRegistrationRequest
{
    [Required]
    [MinLength(2)]
    public string SellerName { get; set; } = string.Empty;

    public string SellerPhone { get; set; } = string.Empty;
}
