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
    public DbSet<LivestockProduce> LivestockProduces => Set<LivestockProduce>();
    public DbSet<LivestockDetail> LivestockDetails => Set<LivestockDetail>();
    public DbSet<BreedingEvent> BreedingEvents => Set<BreedingEvent>();
    public DbSet<LivestockMovement> LivestockMovements => Set<LivestockMovement>();
    public DbSet<LandPlot> LandPlots => Set<LandPlot>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Seed> Seeds => Set<Seed>();
    public DbSet<SeedMovement> SeedMovements => Set<SeedMovement>();
    public DbSet<HarvestSeed> HarvestSeeds => Set<HarvestSeed>();
    public DbSet<HarvestTree> HarvestTrees => Set<HarvestTree>();
    public DbSet<HarvestChemical> HarvestChemicals => Set<HarvestChemical>();
    public DbSet<TreeProduct> TreeProducts => Set<TreeProduct>();
    public DbSet<HarvestProduct> HarvestProducts => Set<HarvestProduct>();
    public DbSet<TreeProductMovement> TreeProductMovements => Set<TreeProductMovement>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<Configuration> Configurations => Set<Configuration>();
    public DbSet<Greenhouse> Greenhouses => Set<Greenhouse>();
    public DbSet<GreenhouseHarvest> GreenhouseHarvests => Set<GreenhouseHarvest>();
    public DbSet<GreenhouseStock> GreenhouseStocks => Set<GreenhouseStock>();
    public DbSet<GreenhouseStockMovement> GreenhouseStockMovements => Set<GreenhouseStockMovement>();
    public DbSet<GreenhouseSeed> GreenhouseSeeds => Set<GreenhouseSeed>();
    public DbSet<GreenhouseHarvestItem> GreenhouseHarvestItems => Set<GreenhouseHarvestItem>();
    public DbSet<GreenhouseHarvestSeed> GreenhouseHarvestSeeds => Set<GreenhouseHarvestSeed>();
    public DbSet<GreenhouseHarvestResult> GreenhouseHarvestResults => Set<GreenhouseHarvestResult>();
    public DbSet<GreenhouseHarvestChemical> GreenhouseHarvestChemicals => Set<GreenhouseHarvestChemical>();
    public DbSet<GreenhouseFloor> GreenhouseFloors => Set<GreenhouseFloor>();
    public DbSet<GreenhouseSection> GreenhouseSections => Set<GreenhouseSection>();
    public DbSet<GreenhouseSectionStock> GreenhouseSectionStocks => Set<GreenhouseSectionStock>();
    public DbSet<StockKind> StockKinds => Set<StockKind>();
    public DbSet<FruitKind> FruitKinds => Set<FruitKind>();
    public DbSet<LivestockKind> LivestockKinds => Set<LivestockKind>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockHistory> StockHistories => Set<StockHistory>();
    public DbSet<StockPhoto> StockPhotos => Set<StockPhoto>();
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
    public DbSet<ProductionMovement> ProductionMovements => Set<ProductionMovement>();
    public DbSet<PurchaseDocument> PurchaseDocuments => Set<PurchaseDocument>();
    public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<PlantScanHistory> PlantScanHistories => Set<PlantScanHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Store stock unit as its readable name (e.g. "Kilogram"). Type is a plain string (a
        // StockKind name) so it needs no conversion.
        modelBuilder.Entity<Stock>()
            .Property(s => s.Unit)
            .HasConversion<string>();

        // Store the seed's unit as its readable name (e.g. "Gram"). Type is a plain string (a
        // StockKind name — seed shares the crop catalog) so it needs no conversion.
        modelBuilder.Entity<Seed>()
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
        modelBuilder.Entity<LivestockKind>().HasIndex(k => k.Name).IsUnique();

        // Feature switches, one row each. A name is unique so a setting can be looked up by it,
        // and new settings arrive as extra seeded rows rather than new columns.
        modelBuilder.Entity<Configuration>().HasIndex(c => c.Name).IsUnique();
        modelBuilder.Entity<Configuration>().HasData(
            new Configuration { Id = 1, Name = "greenhouse", Value = 0 },
            // Unlike greenhouse, these three areas predate the settings table and every existing
            // tenant already keeps records in them, so they seed switched on. Turning one off is a
            // deliberate act, not the starting state.
            new Configuration { Id = 2, Name = "CropFarming", Value = 1 },
            new Configuration { Id = 3, Name = "livestock", Value = 1 },
            new Configuration { Id = 4, Name = "fruitstock", Value = 1 },
            new Configuration { Id = 5, Name = "marketplace", Value = 1 },
            new Configuration { Id = 6, Name = "calendar", Value = 1 });

        // The three seeded catalogs live in BuiltInKinds, which the repositories also read to
        // refuse deleting one of them.
        modelBuilder.Entity<StockKind>().HasData(BuiltInKinds.Stock);
        modelBuilder.Entity<FruitKind>().HasData(BuiltInKinds.Fruit);
        modelBuilder.Entity<LivestockKind>().HasData(BuiltInKinds.Livestock);

        // Store the movement source as its readable name (e.g. "Harvest") instead of an integer.
        modelBuilder.Entity<StockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();
        modelBuilder.Entity<SeedMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();
        modelBuilder.Entity<TreeStockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();

        // Store the harvest status and kind as readable names (e.g. "Planting", "Fruit").
        modelBuilder.Entity<Harvest>()
            .Property(h => h.Status)
            .HasConversion<string>();
        modelBuilder.Entity<Harvest>()
            .Property(h => h.Kind)
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

        // What the group produces. ProductionType is reference data, so the FK restricts deletion —
        // the same rule the production records themselves are held to.
        modelBuilder.Entity<Livestock>()
            .HasOne<ProductionType>()
            .WithMany()
            .HasForeignKey(l => l.ProductionTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LivestockProduce>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(p => p.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LivestockProduce>()
            .HasOne<ProductionType>()
            .WithMany()
            .HasForeignKey(p => p.ProductionTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LivestockProduce>()
            .HasIndex(p => new { p.LivestockId, p.ProductionTypeId })
            .IsUnique();

        // The group's own meat, under the same rule — reference data the group points at, which
        // deleting has to be refused while it is pointed at.
        modelBuilder.Entity<Livestock>()
            .HasOne<ProductionType>()
            .WithMany()
            .HasForeignKey(l => l.MeatProductionTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Each detail (individual animal) belongs to a livestock group; deleting the group
        // removes its details.
        modelBuilder.Entity<LivestockDetail>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(d => d.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);

        // An animal's parents, when it was recorded as a breeding result. SetNull rather than
        // cascade — losing a parent must not take its offspring with it — and Restrict would be
        // worse still, since it would refuse to remove any animal that had ever bred.
        modelBuilder.Entity<LivestockDetail>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(d => d.ParentOneId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<LivestockDetail>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(d => d.ParentTwoId)
            .OnDelete(DeleteBehavior.SetNull);

        // Store the movement's cause as its readable name (e.g. "Purchase").
        modelBuilder.Entity<LivestockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();

        // A movement is part of its group's account of itself; deleting the group takes them.
        modelBuilder.Entity<LivestockMovement>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(m => m.LivestockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Store the breeding stage as its readable name (e.g. "PregnancyConfirmed").
        modelBuilder.Entity<BreedingEvent>()
            .Property(b => b.Status)
            .HasConversion<string>();

        // A breeding event outlives what it points at. All three references are optional and are
        // nulled rather than cascaded: losing the sire, the dam or the group is not a reason to
        // lose the record that the pairing happened, and the dates it carries are the only account
        // of it. SetNull throughout also keeps the group's cascade to its details from reaching in
        // here as a second path.
        modelBuilder.Entity<BreedingEvent>()
            .HasOne<Livestock>()
            .WithMany()
            .HasForeignKey(b => b.LivestockId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BreedingEvent>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(b => b.MaleAnimalId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BreedingEvent>()
            .HasOne<LivestockDetail>()
            .WithMany()
            .HasForeignKey(b => b.FemaleAnimalId)
            .OnDelete(DeleteBehavior.SetNull);

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

        // Each harvest belongs to a farm; deleting the farm removes harvests recorded against it.
        // Nullable so existing/legacy harvests aren't forced to have one.
        modelBuilder.Entity<Harvest>()
            .HasOne<Farm>()
            .WithMany()
            .HasForeignKey(h => h.FarmId)
            .OnDelete(DeleteBehavior.Cascade);

        // A harvest may additionally be assigned to a specific plot within that farm; deleting the
        // plot removes harvests recorded against it. Nullable — a more specific refinement on top
        // of FarmId, not required on its own.
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

        // A plot grows one of the farm's tree stock entries. Deleting the stock leaves the plot
        // standing — it keeps its crop name and its area — so the reference just falls away.
        modelBuilder.Entity<LandPlot>()
            .HasOne<TreeStock>()
            .WithMany()
            .HasForeignKey(p => p.TreeStockId)
            .OnDelete(DeleteBehavior.SetNull);

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

        // A greenhouse's stock, seed and harvests all point at it, and none cascade: the
        // greenhouse controller refuses to delete one that still has any, so the rows can't be
        // removed out from under the pages that show them.
        modelBuilder.Entity<GreenhouseStock>()
            .HasOne<Greenhouse>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GreenhouseSeed>()
            .HasOne<Greenhouse>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GreenhouseHarvest>()
            .HasOne<Greenhouse>()
            .WithMany()
            .HasForeignKey(h => h.GreenhouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // Units and status stored as their readable names, matching Stock, Seed and Harvest.
        modelBuilder.Entity<GreenhouseStock>()
            .Property(s => s.Unit)
            .HasConversion<string>();
        modelBuilder.Entity<GreenhouseSeed>()
            .Property(s => s.Unit)
            .HasConversion<string>();
        modelBuilder.Entity<GreenhouseHarvest>()
            .Property(h => h.Status)
            .HasConversion<string>();

        // A planned/actual row belongs to its harvest (cascades) and to the greenhouse stock it
        // targets (cascades, matching HarvestItem/HarvestResult -> Stock) — deleting either side
        // removes the row rather than leaving it pointing at nothing.
        modelBuilder.Entity<GreenhouseHarvestItem>()
            .HasOne<GreenhouseHarvest>()
            .WithMany()
            .HasForeignKey(i => i.GreenhouseHarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GreenhouseHarvestItem>()
            .HasOne<GreenhouseStock>()
            .WithMany()
            .HasForeignKey(i => i.GreenhouseStockId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GreenhouseHarvestResult>()
            .HasOne<GreenhouseHarvest>()
            .WithMany()
            .HasForeignKey(r => r.GreenhouseHarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GreenhouseHarvestResult>()
            .HasOne<GreenhouseStock>()
            .WithMany()
            .HasForeignKey(r => r.GreenhouseStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed sown for a greenhouse harvest belongs to both; removing either drops the row.
        modelBuilder.Entity<GreenhouseHarvestSeed>()
            .HasOne<GreenhouseHarvest>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseHarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GreenhouseHarvestSeed>()
            .HasOne<GreenhouseSeed>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseSeedId)
            .OnDelete(DeleteBehavior.Cascade);

        // A chemical applied to a greenhouse harvest belongs to it; deleting the harvest removes
        // its chemical log. Costs fold into expenses but move no balance.
        modelBuilder.Entity<GreenhouseHarvestChemical>()
            .HasOne<GreenhouseHarvest>()
            .WithMany()
            .HasForeignKey(c => c.GreenhouseHarvestId)
            .OnDelete(DeleteBehavior.Cascade);

        // A floor belongs to its greenhouse, and a section to its floor — deleting either takes
        // its layout with it, matching how deleting a floor is meant to clear everything on it.
        modelBuilder.Entity<GreenhouseFloor>()
            .HasOne<Greenhouse>()
            .WithMany()
            .HasForeignKey(f => f.GreenhouseId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GreenhouseSection>()
            .HasOne<GreenhouseFloor>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseFloorId)
            .OnDelete(DeleteBehavior.Cascade);

        // A pure join row describing what's planted where — neither side is "owned" the way a
        // harvest's sub-rows are, so both directions just cascade the association away rather than
        // blocking deletion of the section or the stock kind.
        modelBuilder.Entity<GreenhouseSectionStock>()
            .HasOne<GreenhouseSection>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseSectionId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<GreenhouseSectionStock>()
            .HasOne<GreenhouseStock>()
            .WithMany()
            .HasForeignKey(s => s.GreenhouseStockId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GreenhouseStockMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();
        modelBuilder.Entity<GreenhouseStockMovement>()
            .HasOne<GreenhouseStock>()
            .WithMany()
            .HasForeignKey(m => m.GreenhouseStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each movement belongs to a stock; deleting the stock removes its movement log.
        modelBuilder.Entity<StockMovement>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(m => m.StockId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each seed movement belongs to a seed; deleting the seed removes its history.
        modelBuilder.Entity<SeedMovement>()
            .HasOne<Seed>()
            .WithMany()
            .HasForeignKey(m => m.SeedId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed sown for a harvest belongs to both; removing either drops the usage row. The
        // movement it owns goes with it, so a deleted harvest can't leave orphaned history.
        modelBuilder.Entity<HarvestSeed>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(s => s.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HarvestSeed>()
            .HasOne<Seed>()
            .WithMany()
            .HasForeignKey(s => s.SeedId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SeedMovement>()
            .HasOne<HarvestSeed>()
            .WithMany()
            .HasForeignKey(m => m.HarvestSeedId)
            .OnDelete(DeleteBehavior.Cascade);

        // Tree products are a standalone catalog, keyed by their readable unit name.
        modelBuilder.Entity<TreeProduct>()
            .Property(p => p.Unit)
            .HasConversion<string>();
        // A tree is assigned one product it grows; deleting that product just clears the link.
        modelBuilder.Entity<TreeStock>()
            .HasOne<TreeProduct>()
            .WithMany()
            .HasForeignKey(s => s.TreeProductId)
            .OnDelete(DeleteBehavior.SetNull);
        // ...and that product comes off no other orchard: the row yielding it *is* that orchard.
        // TreeStocksController is what reports the clash readably, but two writes racing would both
        // pass its check, so the pairing is unique in the table as well. Filtered to the rows that
        // name a product — fruit recorded before one was required carries none, and the filter is
        // also what keeps this index addable to a live database.
        modelBuilder.Entity<TreeStock>()
            .HasIndex(s => s.TreeProductId)
            .IsUnique()
            .HasFilter("\"TreeProductId\" IS NOT NULL");
        // A harvest's recorded produce belongs to the harvest (cascades with it) and to a
        // catalog product (Restrict — a product still referenced by harvest history can't be
        // deleted, which the controller reports as a conflict rather than a 500).
        modelBuilder.Entity<HarvestProduct>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(p => p.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HarvestProduct>()
            .HasOne<TreeProduct>()
            .WithMany()
            .HasForeignKey(p => p.TreeProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // A product's movement ledger: source stored as its readable name; a movement belongs to
        // its product (cascades) and, for harvest ones, to the produce row that owns it (cascades).
        modelBuilder.Entity<TreeProductMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();
        modelBuilder.Entity<TreeProductMovement>()
            .HasOne<TreeProduct>()
            .WithMany()
            .HasForeignKey(m => m.TreeProductId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TreeProductMovement>()
            .HasOne<HarvestProduct>()
            .WithMany()
            .HasForeignKey(m => m.HarvestProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Trees picked for a harvest belong to both the harvest and the orchard; removing
        // either drops the row. Nothing else follows from it — picking moves no balance.
        modelBuilder.Entity<HarvestTree>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(h => h.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<HarvestTree>()
            .HasOne<TreeStock>()
            .WithMany()
            .HasForeignKey(h => h.TreeStockId)
            .OnDelete(DeleteBehavior.Cascade);

        // A chemical applied to a harvest belongs to it; deleting the harvest removes its
        // chemical log. Its cost folds into the harvest's expenses but moves no balance.
        modelBuilder.Entity<HarvestChemical>()
            .HasOne<Harvest>()
            .WithMany()
            .HasForeignKey(c => c.HarvestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each photo belongs to a single stock; deleting the stock removes its photo history.
        modelBuilder.Entity<StockPhoto>()
            .HasOne<Stock>()
            .WithMany()
            .HasForeignKey(p => p.StockId)
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

        // A production movement (e.g. a marketplace sale) adjusts a type/unit balance; the
        // source is stored as its readable name, matching the stock movement convention.
        // ProductionType and Unit are reference data, so the FKs restrict deletion.
        modelBuilder.Entity<ProductionMovement>()
            .Property(m => m.Source)
            .HasConversion<string>();

        modelBuilder.Entity<PurchaseItem>()
            .Property(i => i.Kind)
            .HasConversion<string>();
        modelBuilder.Entity<PurchaseItem>()
            .HasOne<PurchaseDocument>()
            .WithMany()
            .HasForeignKey(i => i.PurchaseDocumentId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProductionMovement>()
            .HasOne<ProductionType>()
            .WithMany()
            .HasForeignKey(m => m.ProductionTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProductionMovement>()
            .HasOne<Unit>()
            .WithMany()
            .HasForeignKey(m => m.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Fixed reference lists: what an animal can produce, and the units it's measured in.
        // Ids 5 and 6 were "Meat" and "Leather" and are deliberately absent — a group here is a
        // herd that keeps producing, and neither is that. The ids are left unused rather than
        // reassigned, so existing rows that still point at them keep their meaning.
        modelBuilder.Entity<ProductionType>().HasData(
            new ProductionType { Id = 1, Name = "Milk" },
            new ProductionType { Id = 2, Name = "Egg" },
            new ProductionType { Id = 3, Name = "Wool" },
            new ProductionType { Id = 4, Name = "Honey" },
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
