using Microsoft.AspNetCore.Http;

namespace Server.Services.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string subfolder);
}
