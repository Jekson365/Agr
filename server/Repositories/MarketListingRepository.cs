using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class MarketListingRepository(MasterDbContext context) : IMarketListingRepository
{
    public async Task<IEnumerable<MarketListingDto>> GetAllAsync(
        ListingType? type, ListingCategory? category, string? search, int? sellerId)
    {
        var query = context.MarketListings.AsNoTracking().AsQueryable();

        if (type is not null)
        {
            query = query.Where(l => l.Type == type);
        }
        if (category is not null)
        {
            query = query.Where(l => l.Category == category);
        }
        if (sellerId is not null)
        {
            query = query.Where(l => l.SellerId == sellerId);
        }
        else
        {
            // Public buy/rent browsing never shows listings the seller has marked sold/completed.
            query = query.Where(l => l.Status == ListingStatus.Active);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l => l.Title.ToLower().Contains(term) || l.ItemType.ToLower().Contains(term));
        }

        // Promoted listings come first, newest-first within each group. Sorted in the database
        // rather than in the clients, so every caller — the marketplace grid, the SPA, anything
        // later — gets the same order without having to know the rule.
        var listings = await query
            .OrderByDescending(l => l.IsPremium)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();
        return await AttachSellersAsync(listings);
    }

    public async Task<MarketListingDto?> GetByIdAsync(int id)
    {
        var listing = await context.MarketListings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        if (listing is null)
        {
            return null;
        }

        var seller = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == listing.SellerId);
        return MarketListingDto.From(listing, seller);
    }

    public async Task<MarketListingDto> AddAsync(MarketListing listing)
    {
        context.MarketListings.Add(listing);
        await context.SaveChangesAsync();

        var seller = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == listing.SellerId);
        return MarketListingDto.From(listing, seller);
    }

    /// <summary>Batches the seller lookup for a page of listings into a single query instead of one per row.</summary>
    private async Task<IEnumerable<MarketListingDto>> AttachSellersAsync(List<MarketListing> listings)
    {
        var sellerIds = listings.Select(l => l.SellerId).Distinct().ToList();
        var sellers = await context.Users.AsNoTracking()
            .Where(u => sellerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        return listings.Select(l =>
        {
            sellers.TryGetValue(l.SellerId, out var seller);
            return MarketListingDto.From(l, seller);
        });
    }

    public async Task RequestPremiumAsync(int id)
    {
        var listing = await context.MarketListings.FirstOrDefaultAsync(l => l.Id == id);
        // Already asked, or already promoted: leave the original timestamp where it is so a repeat
        // request does not send the seller to the back of a queue ordered by when they joined it.
        if (listing is null || listing.PremiumRequestedAt is not null || listing.IsPremium)
        {
            return;
        }

        listing.PremiumRequestedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
    }

    public async Task<bool> UpdateAsync(MarketListing listing)
    {
        var existing = await context.MarketListings.FindAsync(listing.Id);
        if (existing is null)
        {
            return false;
        }

        existing.Type = listing.Type;
        existing.Category = listing.Category;
        existing.ItemType = listing.ItemType;
        existing.Title = listing.Title;
        existing.Description = listing.Description;
        existing.Price = listing.Price;
        existing.PriceUnit = listing.PriceUnit;
        existing.Quantity = listing.Quantity;
        existing.Location = listing.Location;
        existing.ImagePaths = listing.ImagePaths;
        existing.Status = listing.Status;
        existing.SourceKind = listing.SourceKind;
        existing.SourceId = listing.SourceId;
        existing.SourceUnitId = listing.SourceUnitId;
        // SellerId, SellerName, CreatedAt and IsPremium are fixed once created. Premium especially:
        // this method is reachable by the listing's own seller, and a promotion a seller can award
        // themselves is not a promotion.

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAfterSaleAsync(int id, decimal quantity)
    {
        var existing = await context.MarketListings.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        // A listing with no quantity was never reduced — completing it was the whole change.
        if (existing.Quantity is not null)
        {
            existing.Quantity += quantity;
        }
        existing.Status = ListingStatus.Active;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.MarketListings.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.MarketListings.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
