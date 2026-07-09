namespace Server.Models;

/// <summary>
/// A marketplace listing — a good or piece of equipment a user is offering for sale or rent.
/// Lives in the shared master database (unlike almost everything else in this app, which is
/// siloed per-tenant) since a marketplace only makes sense if every user can see every other
/// user's listings. It's a self-contained snapshot rather than a live link into the seller's
/// tenant database: tenant-side ids (e.g. a Stock row's id) aren't meaningful outside that
/// tenant's own database, so <see cref="ItemType"/> just carries the underlying stock/fruit/
/// animal kind's name (for icon/label lookup) rather than a foreign key.
/// </summary>
public class MarketListing
{
    public int Id { get; set; }

    /// <summary>The listing owner's user id (master database — see <see cref="User"/>).</summary>
    public int SellerId { get; set; }

    /// <summary>Snapshot of the seller's name at listing time, so display doesn't need a join.</summary>
    public string SellerName { get; set; } = string.Empty;

    public ListingType Type { get; set; }
    public ListingCategory Category { get; set; }

    /// <summary>The underlying stock/fruit/animal kind name (e.g. "Tomato", "Apple", "Cow"), used
    /// for icon lookup and as the label fallback. Free text for Equipment/Other.</summary>
    public string ItemType { get; set; } = string.Empty;

    /// <summary>Optional custom title overriding the kind label, e.g. "Dutch Cucumbers" or
    /// "Tractor John Deere 5075E".</summary>
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public decimal Price { get; set; }

    /// <summary>How the price is measured, e.g. "kg", "day", "head" — free text for display
    /// (e.g. "$70 / day").</summary>
    public string PriceUnit { get; set; } = string.Empty;

    public decimal? Quantity { get; set; }
    public string Location { get; set; } = string.Empty;

    /// <summary>Paths to seller-uploaded photos (see <see cref="MarketListingsController.UploadImage"/>),
    /// shown as a slider; empty to fall back to the category/item-type's built-in artwork.</summary>
    public List<string> ImagePaths { get; set; } = [];

    public ListingStatus Status { get; set; } = ListingStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
