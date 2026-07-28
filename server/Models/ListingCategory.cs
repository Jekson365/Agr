namespace Server.Models;

public enum ListingCategory
{
    Stock,

    /// <summary>Fruit trees themselves (the orchard, counted in trees).</summary>
    TreeStock,
    Livestock,
    Equipment,

    /// <summary>Produce a fruit tree yields (see <c>TreeProduct</c>) — sold by the amount on
    /// hand, drawn from the product's balance when the listing is marked sold.</summary>
    TreeProduct,
    Other,
}
