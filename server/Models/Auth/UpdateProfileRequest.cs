using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

public class UpdateProfileRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}
