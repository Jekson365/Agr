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
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l => l.Title.ToLower().Contains(term) || l.ItemType.ToLower().Contains(term));
        }

        var listings = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
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
        // SellerId, SellerName, and CreatedAt are fixed once created.

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
