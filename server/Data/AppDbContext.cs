using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

/// <summary>
/// Per-user domain database. Each user has their own physical Postgres database with this schema
/// (named <c>farm_user_{userId}</c>); the connection is resolved per request from the caller's user id.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Livestock> Livestock => Set<Livestock>();
    public DbSet<LivestockDetail> LivestockDetails => Set<LivestockDetail>();
    public DbSet<LandPlot> LandPlots => Set<LandPlot>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<StockKind> StockKinds => Set<StockKind>();
    public DbSet<FruitKind> FruitKinds => Set<FruitKind>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockHistory> StockHistories => Set<StockHistory>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<StockFeed> StockFeeds => Set<StockFeed>();
    public DbSet<TreeStock> TreeStocks => Set<TreeStock>();
    public DbSet<TreeStockMovement> TreeStockMovements => Set<TreeStockMovement>();
    public DbSet<Harvest> Harvests => Set<Harvest>();
    public DbSet<HarvestItem> HarvestItems => Set<HarvestItem>();
    public DbSet<HarvestResult> HarvestResults => Set<HarvestResult>();
    public DbSet<ProductionType> ProductionTypes => Set<ProductionType>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<AnimalProduction> AnimalProductions => Set<AnimalProduction>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Store the animal type as its readable name (e.g. "Cow") instead of an integer.
        modelBuilder.Entity<Livestock>()
            .Property(l => l.Type)
            .HasConversion<string>();

        // Store stock unit as its readable name (e.g. "Kilogram"). Type is a plain string (a
        // StockKind name) so it needs no conversion.
        modelBuilder.Entity<Stock>()
            .Property(s => s.Unit)
            .HasConversion<string>();

        // Store tree stock's unit as its readable name (e.g. "Box"). Type is a plain string (a
        // FruitKind name) so it needs no conversion.
        modelBuilder.Entity<TreeStock>()
            .Property(s => s.Unit)
            .HasConversion<string>();

        // Custom kinds get whatever name a user types; built-in defaults are seeded below. Both
        // catalogs are looked up by name (not id) from Stock.Type / TreeStock.Type, so the only
        // integrity rule needed here is that a name can't be added twice.
        modelBuilder.Entity<StockKind>().HasIndex(k => k.Name).IsUnique();
        modelBuilder.Entity<FruitKind>().HasIndex(k => k.Name).IsUnique();

        modelBuilder.Entity<StockKind>().HasData(
            new StockKind { Id = 1, Name = "Weat" },
            new StockKind { Id = 2, Name = "Beans" },
            new StockKind { Id = 3, Name = "Milk" },
            new StockKind { Id = 4, Name = "Cabbage" },
            new StockKind { Id = 5, Name = "Cucumber" },
            new StockKind { Id = 6, Name = "Eggplant" },
            new StockKind { Id = 7, Name = "Potato" },
            new StockKind { Id = 8, Name = "Pumpkin" },
            new StockKind { Id = 9, Name = "Tomato" });

        modelBuilder.Entity<FruitKind>().HasData(
            new FruitKind { Id = 1, Name = "Apple" },
            new FruitKind { Id = 2, Name = "Orange" },
            new FruitKind { Id = 3, Name = "Banana" });

        // Store the movement source as its readable name (e.g. "Harvest") instead of an integer.
        modelBuilder.Entity<StockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();
        modelBuilder.Entity<TreeStockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();

        // Store the harvest status as its readable name (e.g. "Planting") instead of an integer.
        modelBuilder.Entity<Harvest>()
            .Property(h => h.Status)
            .HasConversion<string>();

        // Store the animal's gender as its readable name (e.g. "Male") instead of an integer.
        modelBuilder.Entity<LivestockDetail>()
            .Property(d => d.Gender)
            .HasConversion<string>();

        // Every livestock entry belongs to a farm; deleting a farm removes its livestock.
        modelBuilder.Entity<Livestock>()
            .HasOne<Farm>()
            .WithMany()
            .HasForeignKey(l => l.FarmId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each detail (individual animal) belongs to a livestock group; deleting the group
        // removes its details.
        modelBuilder.Entity<LivestockDetail>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(d => d.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each plot belongs to a farm; deleting the farm removes its plots.
        modelBuilder.Entity<LandPlot>()
            .HasOne<Farm>()
            .WithMany()
            .HasForeignKey(p => p.FarmId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each weight reading belongs to a single animal; deleting the animal removes its history.
        modelBuilder.Entity<StockHistory>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(h => h.StockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each medical record belongs to a single animal; deleting the animal removes its records.
        modelBuilder.Entity<MedicalRecord>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(r => r.StockId)
            .OnDelete(DeleteBehavior.Cascade);

        // A feed links a livestock group to a stock good; removing either clears the feed entry.
        modelBuilder.Entity<StockFeed>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(f => f.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<StockFeed>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(f => f.StockId)
            .OnDelete(DeleteBehavior.Cascade);

        // A harvest may be assigned to a land plot; deleting the plot removes harvests recorded
        // against it. Nullable so existing/legacy harvests aren't forced to have one.
        modelBuilder.Entity<Harvest>()
            .HasOne<LandPlot>()
            .WithMany()
            .HasForeignKey(h => h.LandPlotId)
            .OnDelete(DeleteBehavior.Cascade);

        // A tree stock entry may be assigned to a land plot; deleting the plot removes tree
        // stock recorded against it. Nullable so it can be created before a plot is picked.
        modelBuilder.Entity<TreeStock>()
            .HasOne<LandPlot>()
            .WithMany()
            .HasForeignKey(t => t.LandPlotId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each tree stock movement belongs to a tree stock; deleting the tree stock removes its
        // movement log.
        modelBuilder.Entity<TreeStockMovement>()
            .HasOne<TreeStock>()
            .WithMany()
            .HasForeignKey(m => m.TreeStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each harvest item belongs to a harvest; deleting the harvest removes its items.
        modelBuilder.Entity<HarvestItem>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(i => i.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each harvest item references the stock bucket (or tree stock) it contributed to;
        // deleting that stock removes the item (matches how StockFeed relates to Stock). Both FKs
        // are nullable — exactly one is set per row (enforced in HarvestItemsController).
        modelBuilder.Entity<HarvestItem>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(i => i.StockId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HarvestItem>()
            .HasOne<TreeStock>()
            .WithMany()
            .HasForeignKey(i => i.TreeStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each movement belongs to a stock; deleting the stock removes its movement log.
        modelBuilder.Entity<StockMovement>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(m => m.StockId)
            .OnDelete(DeleteBehavior.Cascade);

        // A harvest-sourced movement is owned by the harvest item it represents; deleting the
        // item removes its movement rather than leaving a dangling log entry.
        modelBuilder.Entity<StockMovement>()
            .HasOne<HarvestItem>()
            .WithMany()
            .HasForeignKey(m => m.HarvestItemId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TreeStockMovement>()
            .HasOne<HarvestItem>()
            .WithMany()
            .HasForeignKey(m => m.HarvestItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each harvest result belongs to a harvest; deleting the harvest removes its results.
        modelBuilder.Entity<HarvestResult>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(r => r.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each harvest result references the stock bucket (or tree stock) it contributed to;
        // deleting that stock removes the result (matches how HarvestItem relates to Stock). Both
        // FKs are nullable — exactly one is set per row (enforced in HarvestResultsController).
        modelBuilder.Entity<HarvestResult>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(r => r.StockId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HarvestResult>()
            .HasOne<TreeStock>()
            .WithMany()
            .HasForeignKey(r => r.TreeStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // A movement caused by a recorded harvest result is owned by that result; deleting the
        // result removes its movement rather than leaving a dangling log entry.
        modelBuilder.Entity<StockMovement>()
            .HasOne<HarvestResult>()
            .WithMany()
            .HasForeignKey(m => m.HarvestResultId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TreeStockMovement>()
            .HasOne<HarvestResult>()
            .WithMany()
            .HasForeignKey(m => m.HarvestResultId)
            .OnDelete(DeleteBehavior.Cascade);

        // A production record belongs to either a single animal or a whole livestock group
        // (never both); deleting the owning animal/group removes its production history.
        // ProductionType and Unit are reference data, so those FKs use the default (Restrict)
        // behavior instead.
        modelBuilder.Entity<AnimalProduction>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(p => p.AnimalId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AnimalProduction>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(p => p.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AnimalProduction>()
            .HasOne<ProductionType>()
            .WithMany()
            .HasForeignKey(p => p.ProductionTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AnimalProduction>()
            .HasOne<Unit>()
            .WithMany()
            .HasForeignKey(p => p.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Fixed reference lists: what an animal can produce, and the units it's measured in.
        modelBuilder.Entity<ProductionType>().HasData(
            new ProductionType { Id = 1, Name = "Milk" },
            new ProductionType { Id = 2, Name = "Egg" },
            new ProductionType { Id = 3, Name = "Wool" },
            new ProductionType { Id = 4, Name = "Honey" },
            new ProductionType { Id = 5, Name = "Meat" },
            new ProductionType { Id = 6, Name = "Leather" },
            new ProductionType { Id = 7, Name = "Manure" },
            new ProductionType { Id = 8, Name = "Silk" });

        modelBuilder.Entity<Unit>().HasData(
            new Unit { Id = 1, Name = "Kilogram", ShortName = "kg" },
            new Unit { Id = 2, Name = "Liter", ShortName = "L" },
            new Unit { Id = 3, Name = "Piece", ShortName = "pcs" },
            new Unit { Id = 4, Name = "Gram", ShortName = "g" },
            new Unit { Id = 5, Name = "Dozen", ShortName = "dz" });
    }
}
