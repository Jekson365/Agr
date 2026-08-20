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

    /// <summary>Stamps a promotion request, leaving an existing one alone.</summary>
    Task RequestPremiumAsync(int id);

    /// <summary>Puts a listing back the way it was before a sale was recorded against it: the
    /// quantity is returned and the listing goes active again, whether the sale had completed it
    /// or just reduced what was left.</summary>
    Task<bool> RestoreAfterSaleAsync(int id, decimal quantity);
    Task<bool> DeleteAsync(int id);
}
