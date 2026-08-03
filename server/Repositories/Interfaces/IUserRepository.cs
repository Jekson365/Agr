using Server.Models;
using Server.Models.Auth;

namespace Server.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    /// <summary>
    /// The account that signs in with this number, or null. Only a verified number counts — see
    /// <see cref="User.PhoneVerifiedAt"/> for why an unverified one is nobody's identity.
    /// </summary>
    Task<User?> GetByVerifiedPhoneAsync(string phoneNumber);

    Task<User?> GetByIdAsync(int id);
    Task<bool> EmailExistsAsync(string email);

    /// <summary>Whether some account has already proved it holds this number.</summary>
    Task<bool> VerifiedPhoneExistsAsync(string phoneNumber);
    Task<User> AddAsync(User user);
    Task<User?> UpdateProfileAsync(int id, UpdateProfileRequest request);
    Task<User?> UpdateLocationAsync(int id, UpdateLocationRequest request);
}
