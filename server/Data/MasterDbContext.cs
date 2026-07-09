using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

/// <summary>
/// Shared master database. Holds the global user list so that login can resolve a user
/// (and therefore which per-user database to open) before touching any tenant database.
/// </summary>
public class MasterDbContext(DbContextOptions<MasterDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<MarketListing> MarketListings => Set<MarketListing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        // Email is the login identifier, unique across all users.
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Store listing type/category/status as their readable names (e.g. "Rent") instead of integers.
        modelBuilder.Entity<MarketListing>()
            .Property(l => l.Type)
            .HasConversion<string>();
        modelBuilder.Entity<MarketListing>()
            .Property(l => l.Category)
            .HasConversion<string>();
        modelBuilder.Entity<MarketListing>()
            .Property(l => l.Status)
            .HasConversion<string>();

        // A listing belongs to the user who created it; deleting the user removes their listings.
        modelBuilder.Entity<MarketListing>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(l => l.SellerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
