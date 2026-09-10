using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class FileStorageService(
    IWebHostEnvironment environment,
    MasterDbContext masterDb,
    ICurrentTenant currentTenant) : IFileStorageService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    private static readonly string[] AllowedDocumentExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    public Task<string> SaveImageAsync(IFormFile file, string subfolder)
    {
        return SaveAsync(file, subfolder, AllowedExtensions, "Unsupported image type.");
    }

    public Task<string> SaveDocumentAsync(IFormFile file, string subfolder)
    {
        return SaveAsync(file, subfolder, AllowedDocumentExtensions, "Unsupported file type.");
    }

    private async Task<string> SaveAsync(IFormFile file, string subfolder, string[] allowed, string rejection)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(extension))
        {
            throw new InvalidOperationException(rejection);
        }

        var user = await masterDb.Users.FindAsync(currentTenant.UserId)
            ?? throw new InvalidOperationException("User not found.");

        var limitBytes = StoragePlanLimits.BytesFor(user.Plan);
        if (limitBytes is not null && user.StorageUsedBytes + file.Length > limitBytes)
        {
            throw new InvalidOperationException(
                "Storage limit reached for your plan. Delete some photos or upgrade your plan to upload more.");
        }

        var folderPath = Path.Combine(environment.WebRootPath, "uploads", subfolder);
        Directory.CreateDirectory(folderPath);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(folderPath, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.StorageUsedBytes += file.Length;
        await masterDb.SaveChangesAsync();

        return $"/uploads/{subfolder}/{fileName}";
    }

    public async Task DeleteImageAsync(string? imagePath)
    {
        if (string.IsNullOrWhiteSpace(imagePath) || !imagePath.StartsWith("/uploads/"))
        {
            return;
        }

        var relativePath = imagePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(environment.WebRootPath, relativePath);

        if (!File.Exists(filePath))
        {
            return;
        }

        var freedBytes = new FileInfo(filePath).Length;
        File.Delete(filePath);

        var user = await masterDb.Users.FindAsync(currentTenant.UserId);
        if (user is null)
        {
            return;
        }

        user.StorageUsedBytes = Math.Max(0, user.StorageUsedBytes - freedBytes);
        await masterDb.SaveChangesAsync();
    }
}
