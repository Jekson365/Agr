using System.ComponentModel.DataAnnotations;

namespace Server.Models.Auth;

/// <summary>Asks for a code to be texted to a number, ahead of registering with it.</summary>
public class SendPhoneCodeRequest
{
    [Required]
    public string PhoneNumber { get; set; } = string.Empty;
}

/// <summary>
/// Registers an account against a number, proving it with the code that was just texted. Mirrors
/// <see cref="RegisterRequest"/>, with the number and its code standing in for the email address.
/// </summary>
public class PhoneRegisterRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Code { get; set; } = string.Empty;
}

/// <summary>Signs in with a number instead of an email address. The password is the same one.</summary>
public class PhoneLoginRequest
{
    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
