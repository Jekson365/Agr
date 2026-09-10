using Microsoft.AspNetCore.Http;

namespace Server.Services.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string subfolder);

    /// <summary>Same as <see cref="SaveImageAsync"/> but also accepts a PDF, for uploads offered as
    /// a link to open rather than drawn into the page.</summary>
    Task<string> SaveDocumentAsync(IFormFile file, string subfolder);

    /// <summary>
    /// Deletes a previously-uploaded image (identified by the path <see cref="SaveImageAsync"/>
    /// returned) and reclaims its size from the current user's storage usage. A no-op for a null,
    /// blank, or already-missing path.
    /// </summary>
    Task DeleteImageAsync(string? imagePath);
}
