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
    public DbSet<Neighbour> Neighbours => Set<Neighbour>();
    public DbSet<NeighbourCoinAward> NeighbourCoinAwards => Set<NeighbourCoinAward>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<User>()
            .Property(u => u.Plan)
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

        modelBuilder.Entity<Neighbour>()
            .Property(n => n.Status)
            .HasConversion<string>();

        // One row per ordered pair. It doesn't stop A→B and B→A both existing — that is a genuine
        // race between two people asking each other at once, which the repository resolves by
        // accepting rather than by refusing the insert.
        modelBuilder.Entity<Neighbour>()
            .HasIndex(n => new { n.RequesterId, n.AddresseeId })
            .IsUnique();

        // Looking up "everyone linked to me" hits either column, so both are worth indexing.
        modelBuilder.Entity<Neighbour>()
            .HasIndex(n => n.AddresseeId);

        // A deleted account takes its links with it, from whichever side it held them.
        modelBuilder.Entity<Neighbour>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(n => n.RequesterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Neighbour>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(n => n.AddresseeId)
            .OnDelete(DeleteBehavior.Cascade);

        // One award per pair, and the index is what enforces "only ever paid once" — two
        // acceptances landing together are refused here rather than paid twice.
        modelBuilder.Entity<NeighbourCoinAward>()
            .HasIndex(a => new { a.UserAId, a.UserBId })
            .IsUnique();

        // Ids are never reused, so a deleted account can't come back and be paid for again.
        modelBuilder.Entity<NeighbourCoinAward>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(a => a.UserAId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NeighbourCoinAward>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(a => a.UserBId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
