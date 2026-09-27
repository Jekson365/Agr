using Server.Models;
using Server.Models.Auth;

namespace Server.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    Task<User?> GetBySignInPhoneAsync(string phoneNumber);

    Task<User?> GetByIdAsync(int id);
    Task<bool> EmailExistsAsync(string email);

    Task<bool> SignInPhoneExistsAsync(string phoneNumber);
    Task<User> AddAsync(User user);
    Task<User?> UpdateProfileAsync(int id, UpdateProfileRequest request);
    Task<User?> UpdateLocationAsync(int id, UpdateLocationRequest request);

    /// <summary>
    /// Marks the account a marketplace seller and records what it trades under. Re-registering
    /// updates the details and leaves <see cref="User.SellerRegisteredAt"/> at the first time,
    /// which is the date the account actually became a seller.
    /// </summary>
    Task<User?> RegisterSellerAsync(int id, string sellerName, string sellerPhone);

    /// <summary>Rewrites what a seller shows buyers. Refuses an account that has not registered
    /// to sell — a profile is the seller's, and there is none without one.</summary>
    Task<User?> UpdateSellerProfileAsync(int id, SellerProfileRequest request);
}
