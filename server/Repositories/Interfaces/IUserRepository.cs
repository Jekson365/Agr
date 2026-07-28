using Server.Models;
using Server.Models.Auth;

namespace Server.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<bool> EmailExistsAsync(string email);
    Task<User> AddAsync(User user);
    Task<User?> UpdateProfileAsync(int id, UpdateProfileRequest request);
    Task<User?> UpdateLocationAsync(int id, UpdateLocationRequest request);
}
