namespace Server.Models.Admin;

/// <summary>
/// A registered account as the manager page shows it.
///
/// Deliberately narrow. <see cref="User"/> carries a password hash, a tenant database name and
/// precise coordinates; none of that belongs in a list of who has signed up, and a DTO that simply
/// mirrored the entity would leak all three the first time someone opened the page.
/// </summary>
public class AdminUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool PhoneVerified { get; set; }
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public StoragePlan Plan { get; set; }
    public int Coins { get; set; }
    public bool IsSuperAdmin { get; set; }

    /// <summary>Whether this account may open the farm management software. An account registered
    /// from the marketplace starts without it; granting it is what lets them in.</summary>
    public bool HasManagementAccess { get; set; }
    public bool IsSeller { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>How many listings this account has on the market. Cheap context for deciding
    /// whether an account is active, without opening it.</summary>
    public int ListingCount { get; set; }

    public static AdminUserDto From(User user, int listingCount) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Surname = user.Surname,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        PhoneVerified = user.PhoneVerifiedAt is not null,
        City = user.City,
        Country = user.Country,
        ImagePath = user.ImagePath,
        Plan = user.Plan,
        Coins = user.Coins,
        IsSuperAdmin = user.IsSuperAdmin,
        HasManagementAccess = user.HasManagementAccess,
        IsSeller = user.IsSeller,
        CreatedAt = user.CreatedAt,
        ListingCount = listingCount,
    };
}

/// <summary>A listing waiting on a promotion decision, with enough of the seller to judge it.</summary>
public class PremiumRequestDto
{
    public int ListingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public ListingCategory Category { get; set; }
    public ListingType Type { get; set; }
    public decimal Price { get; set; }
    public string PriceUnit { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public List<string> ImagePaths { get; set; } = [];
    public ListingStatus Status { get; set; }

    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; }
    public bool IsPremium { get; set; }
    public DateTime? GrantedAt { get; set; }

    public static PremiumRequestDto From(MarketListing listing, User? seller) => new()
    {
        ListingId = listing.Id,
        Title = listing.Title,
        ItemType = listing.ItemType,
        Category = listing.Category,
        Type = listing.Type,
        Price = listing.Price,
        PriceUnit = listing.PriceUnit,
        Location = listing.Location,
        ImagePaths = listing.ImagePaths,
        Status = listing.Status,
        SellerId = listing.SellerId,
        SellerName = seller is null ? listing.SellerName : $"{seller.Name} {seller.Surname}".Trim(),
        SellerEmail = seller?.Email ?? string.Empty,
        RequestedAt = listing.PremiumRequestedAt ?? listing.CreatedAt,
        IsPremium = listing.IsPremium,
        GrantedAt = listing.PremiumGrantedAt,
    };
}
