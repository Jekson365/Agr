using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Auth;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class UserRepository(MasterDbContext context) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await context.Users.AnyAsync(u => u.Email == email);
    }

    public async Task<User> AddAsync(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    public async Task<User?> UpdateProfileAsync(int id, UpdateProfileRequest request)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null)
        {
            return null;
        }

        user.Name = request.Name.Trim();
        user.Surname = request.Surname.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.Country = request.Country.Trim();
        user.City = request.City.Trim();
        user.BirthDate = request.BirthDate;
        user.ImagePath = request.ImagePath;

        await context.SaveChangesAsync();
        return user;
    }
}
