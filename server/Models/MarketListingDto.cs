namespace Server.Models;

/// <summary>
/// A <see cref="MarketListing"/> enriched with the seller's current profile info (surname, phone
/// number, photo) via a live lookup against <see cref="User"/> — unlike <see cref="MarketListing.SellerName"/>,
/// which is a snapshot, these fields always reflect the seller's latest profile.
/// </summary>
public class MarketListingDto
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerSurname { get; set; } = string.Empty;
    public string SellerPhoneNumber { get; set; } = string.Empty;
    public string SellerImagePath { get; set; } = string.Empty;

    public ListingType Type { get; set; }
    public ListingCategory Category { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string PriceUnit { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public string Location { get; set; } = string.Empty;
    public List<string> ImagePaths { get; set; } = [];
    public ListingStatus Status { get; set; }

    public ListingSourceKind? SourceKind { get; set; }
    public int? SourceId { get; set; }
    public int? SourceUnitId { get; set; }

    /// <summary>Promoted: shown first and bordered in gold.</summary>
    public bool IsPremium { get; set; }

    /// <summary>Set once the seller has asked for promotion, so their own listing page can say the
    /// request is in rather than offering the button again.</summary>
    public DateTime? PremiumRequestedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public static MarketListingDto From(MarketListing listing, User? seller) => new()
    {
        Id = listing.Id,
        SellerId = listing.SellerId,
        SellerName = listing.SellerName,
        SellerSurname = seller?.Surname ?? string.Empty,
        SellerPhoneNumber = seller?.PhoneNumber ?? string.Empty,
        SellerImagePath = seller?.ImagePath ?? string.Empty,
        Type = listing.Type,
        Category = listing.Category,
        ItemType = listing.ItemType,
        Title = listing.Title,
        Description = listing.Description,
        Price = listing.Price,
        PriceUnit = listing.PriceUnit,
        Quantity = listing.Quantity,
        Location = listing.Location,
        ImagePaths = listing.ImagePaths,
        Status = listing.Status,
        SourceKind = listing.SourceKind,
        SourceId = listing.SourceId,
        SourceUnitId = listing.SourceUnitId,
        IsPremium = listing.IsPremium,
        PremiumRequestedAt = listing.PremiumRequestedAt,
        CreatedAt = listing.CreatedAt,
    };
}
