using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MarketListingsController(
    IMarketListingRepository marketListingRepository,
    ICurrentTenant currentTenant,
    IFileStorageService fileStorageService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MarketListingDto>>> GetAll(
        [FromQuery] ListingType? type,
        [FromQuery] ListingCategory? category,
        [FromQuery] string? search,
        [FromQuery] bool mine = false)
    {
        var sellerId = mine ? currentTenant.UserId : (int?)null;
        return Ok(await marketListingRepository.GetAllAsync(type, category, search, sellerId));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MarketListingDto>> GetById(int id)
    {
        var listing = await marketListingRepository.GetByIdAsync(id);
        return listing is null ? NotFound() : Ok(listing);
    }

    [HttpPost]
    public async Task<ActionResult<MarketListingDto>> Create(MarketListing listing)
    {
        // The seller identity is stamped from the caller's token, never trusted from the client.
        listing.SellerId = currentTenant.UserId;
        listing.SellerName = currentTenant.Name ?? string.Empty;
        listing.Status = ListingStatus.Active;
        listing.CreatedAt = DateTime.UtcNow;

        var created = await marketListingRepository.AddAsync(listing);
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, MarketListing listing)
    {
        if (id != listing.Id)
        {
            return BadRequest();
        }

        var existing = await marketListingRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (existing.SellerId != currentTenant.UserId)
        {
            return Forbid();
        }

        listing.SellerId = existing.SellerId;
        listing.SellerName = existing.SellerName;
        listing.CreatedAt = existing.CreatedAt;

        var updated = await marketListingRepository.UpdateAsync(listing);
        if (!updated)
        {
            return NotFound();
        }

        var removedImagePaths = existing.ImagePaths.Except(listing.ImagePaths);
        foreach (var imagePath in removedImagePaths)
        {
            await fileStorageService.DeleteImageAsync(imagePath);
        }

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await marketListingRepository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }
        if (existing.SellerId != currentTenant.UserId)
        {
            return Forbid();
        }

        var deleted = await marketListingRepository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        foreach (var imagePath in existing.ImagePaths)
        {
            await fileStorageService.DeleteImageAsync(imagePath);
        }

        return NoContent();
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        try
        {
            var imagePath = await fileStorageService.SaveImageAsync(file, "market");
            return Ok(new { imagePath });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
