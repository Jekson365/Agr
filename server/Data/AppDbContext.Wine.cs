using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public partial class AppDbContext
{
    public DbSet<WineBatch> WineBatches => Set<WineBatch>();
    public DbSet<WineBatchGrape> WineBatchGrapes => Set<WineBatchGrape>();
    public DbSet<WineMovement> WineMovements => Set<WineMovement>();
    public DbSet<WineStageChange> WineStageChanges => Set<WineStageChange>();
    public DbSet<WineMeasurement> WineMeasurements => Set<WineMeasurement>();
    public DbSet<WineBottling> WineBottlings => Set<WineBottling>();
    public DbSet<WineOperation> WineOperations => Set<WineOperation>();

    private static void ConfigureWine(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WineBatch>().Property(b => b.Color).HasConversion<string>();
        modelBuilder.Entity<WineBatch>().Property(b => b.Method).HasConversion<string>();
        modelBuilder.Entity<WineBatch>().Property(b => b.Stage).HasConversion<string>();

        modelBuilder.Entity<WineBatchGrape>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(g => g.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WineBatchGrape>()
            .HasOne<TreeProduct>().WithMany().HasForeignKey(g => g.TreeProductId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TreeProductMovement>()
            .HasOne<WineBatchGrape>().WithMany().HasForeignKey(m => m.WineBatchGrapeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineMovement>().Property(m => m.Source).HasConversion<string>();
        modelBuilder.Entity<WineMovement>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(m => m.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WineMovement>()
            .HasOne<WineBottling>().WithMany().HasForeignKey(m => m.WineBottlingId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WineMovement>()
            .HasOne<WineOperation>().WithMany().HasForeignKey(m => m.WineOperationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineStageChange>().Property(c => c.FromStage).HasConversion<string>();
        modelBuilder.Entity<WineStageChange>().Property(c => c.ToStage).HasConversion<string>();
        modelBuilder.Entity<WineStageChange>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(c => c.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineMeasurement>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(m => m.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineBottling>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(b => b.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineOperation>().Property(o => o.Kind).HasConversion<string>();
        modelBuilder.Entity<WineOperation>()
            .HasOne<WineBatch>().WithMany().HasForeignKey(o => o.WineBatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
