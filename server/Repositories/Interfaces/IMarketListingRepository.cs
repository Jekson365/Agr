using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IMarketListingRepository
{
    /// <summary>
    /// Listings visible on the marketplace, newest first, optionally narrowed by type, category,
    /// a title/item-type search, and/or restricted to one seller (for "My Listings").
    /// </summary>
    Task<IEnumerable<MarketListingDto>> GetAllAsync(
        ListingType? type, ListingCategory? category, string? search, int? sellerId);

    Task<MarketListingDto?> GetByIdAsync(int id);
    Task<MarketListingDto> AddAsync(MarketListing listing);
    Task<bool> UpdateAsync(MarketListing listing);
    Task<bool> DeleteAsync(int id);
}
